import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { CollabPayload, CollabState, CollabStatus } from './types';
import { COLLAB_HOST_PARAM, COLLAB_QUERY_PARAM } from './types';
import {
  applyRemoteWorkspace,
  buildWorkspaceSnapshot,
  isApplyingRemoteUpdate,
  useKanbanStore,
} from '../store/kanbanStore';
import { createId } from '../utils/id';
import {
  isCollabServerConfigured,
  isProductionWithoutCollabServer,
  resolveCollabWsUrl,
  supportsBroadcastChannelSync,
} from './collabConfig';

const LOCAL_ORIGIN = 'kanban-local';
const HOST_ROOM_KEY = 'kanban-collab-host-room';
const PAYLOAD_KEY = 'workspace';
const SEED_DELAY_MS = 400;

let ydoc: Y.Doc | null = null;
let provider: WebsocketProvider | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let seedTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let lastPushedJson = '';
let lastAppliedTs = 0;
let canPushLocal = false;
let unsubscribeStore: (() => void) | null = null;
let stateListeners = new Set<(state: CollabState) => void>();

const collabState: CollabState = {
  roomId: null,
  status: 'idle',
  peerCount: 0,
  synced: false,
  transport: 'none',
};

function unwrapEvent<T>(event: T | T[]): T {
  return Array.isArray(event) ? event[0] : event;
}

function getClientId(): string {
  const stored = sessionStorage.getItem('kanban-collab-client-id');
  if (stored) return stored;

  const clientId = createId();
  sessionStorage.setItem('kanban-collab-client-id', clientId);
  return clientId;
}

function getCollabWsUrl(): string | null {
  return resolveCollabWsUrl();
}

export { isCollabServerConfigured, isProductionWithoutCollabServer };

function emitState() {
  for (const listener of stateListeners) {
    listener({ ...collabState });
  }
}

function setCollabStatus(status: CollabStatus) {
  collabState.status = status;
  emitState();
}

function isRoomHost(roomId: string): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get(COLLAB_HOST_PARAM) === '1') return true;
  return sessionStorage.getItem(HOST_ROOM_KEY) === roomId;
}

function markRoomHost(roomId: string): void {
  sessionStorage.setItem(HOST_ROOM_KEY, roomId);
}

function buildPayload(): CollabPayload {
  return {
    v: 1,
    clientId: getClientId(),
    ts: Date.now(),
    data: buildWorkspaceSnapshot(useKanbanStore.getState()),
  };
}

function readPayloadJson(): string | null {
  if (!ydoc) return null;
  const json = ydoc.getMap(PAYLOAD_KEY).get('json');
  return typeof json === 'string' && json.length > 0 ? json : null;
}

function pushLocalState(force = false) {
  if (!ydoc || isApplyingRemoteUpdate()) return;
  if (!force && !canPushLocal) return;

  const payload = buildPayload();
  const json = JSON.stringify(payload);
  if (json === lastPushedJson) return;

  lastPushedJson = json;
  lastAppliedTs = payload.ts;

  ydoc.transact(() => {
    ydoc!.getMap(PAYLOAD_KEY).set('json', json);
  }, LOCAL_ORIGIN);
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    pushLocalState();
  }, 80);
}

function applyRemoteJson(json: string) {
  if (!json) return;

  let payload: CollabPayload;
  try {
    payload = JSON.parse(json) as CollabPayload;
  } catch {
    return;
  }

  if (payload.v !== 1 || !payload.data?.projects) return;

  const isOwnPayload = payload.clientId === getClientId();
  if (isOwnPayload && payload.ts <= lastAppliedTs && json === lastPushedJson) return;
  if (json === lastPushedJson && payload.ts <= lastAppliedTs) return;

  lastPushedJson = json;
  lastAppliedTs = payload.ts;
  applyRemoteWorkspace(payload.data);
  canPushLocal = true;
}

function pullRemoteState() {
  const json = readPayloadJson();
  if (json) applyRemoteJson(json);
}

function maybeSeedLocalState(roomId: string) {
  if (!ydoc) return;

  const existing = readPayloadJson();
  if (existing) {
    applyRemoteJson(existing);
    return;
  }

  if (isRoomHost(roomId)) {
    canPushLocal = true;
    pushLocalState(true);
  }
}

function attachStoreSync() {
  if (unsubscribeStore) return;

  unsubscribeStore = useKanbanStore.subscribe((_state, prev) => {
    if (_state === prev || isApplyingRemoteUpdate() || !collabState.roomId) return;
    schedulePush();
  });
}

function detachStoreSync() {
  unsubscribeStore?.();
  unsubscribeStore = null;
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  if (seedTimer) {
    clearTimeout(seedTimer);
    seedTimer = null;
  }
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export function isCollabHost(): boolean {
  const roomId = getRoomIdFromUrl();
  return roomId ? isRoomHost(roomId) : false;
}

export function getRoomIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const roomId = new URLSearchParams(window.location.search).get(COLLAB_QUERY_PARAM);
  return roomId?.trim() || null;
}

export function buildShareUrl(roomId: string, asHost = false): string {
  const url = new URL(window.location.href);
  url.searchParams.set(COLLAB_QUERY_PARAM, roomId);
  if (asHost) {
    url.searchParams.set(COLLAB_HOST_PARAM, '1');
  } else {
    url.searchParams.delete(COLLAB_HOST_PARAM);
  }
  return url.toString();
}

export function createRoomId(): string {
  return createId().replace(/-/g, '').slice(0, 12);
}

export function navigateToRoom(roomId: string, asHost = false): void {
  const url = buildShareUrl(roomId, asHost);
  window.history.replaceState({}, '', url);
}

export function getCollabState(): CollabState {
  return { ...collabState };
}

export function subscribeCollabState(listener: (state: CollabState) => void): () => void {
  stateListeners.add(listener);
  listener({ ...collabState });
  return () => stateListeners.delete(listener);
}

export function isCollabActive(): boolean {
  return collabState.roomId !== null;
}

function wireDocSync(ymap: Y.Map<unknown>) {
  ymap.observe((event) => {
    if (event.transaction.origin === LOCAL_ORIGIN) return;
    pullRemoteState();
  });

  ydoc!.on('update', (_update, origin) => {
    if (origin === LOCAL_ORIGIN) return;
    pullRemoteState();
  });

  pollTimer = setInterval(pullRemoteState, 1000);

  if (provider) {
    provider.awareness.on('change', () => {
      if (!provider) return;
      collabState.peerCount = Math.max(0, provider.awareness.getStates().size - 1);
      emitState();
    });
  }

  attachStoreSync();
}

function startBroadcastOnlySession(roomId: string, roomName: string) {
  collabState.transport = 'broadcast';
  collabState.synced = true;
  setCollabStatus('connected');

  // Dummy URL  WebSocket is never opened; tabs sync via BroadcastChannel.
  provider = new WebsocketProvider('ws://127.0.0.1:1', roomName, ydoc!, { connect: false });
  provider.connectBc();
  wireDocSync(ydoc!.getMap(PAYLOAD_KEY));
  seedTimer = setTimeout(() => {
    seedTimer = null;
    maybeSeedLocalState(roomId);
  }, SEED_DELAY_MS);
  emitState();
}

function startWebSocketSession(roomId: string, roomName: string, wsUrl: string) {
  collabState.transport = 'websocket';

  provider = new WebsocketProvider(wsUrl, roomName, ydoc!, {
    connect: true,
    resyncInterval: 3000,
  });

  provider.on('status', (event) => {
    const { status } = unwrapEvent(event);

    if (status === 'connected') {
      setCollabStatus('connected');
      pullRemoteState();
      if (seedTimer) clearTimeout(seedTimer);
      seedTimer = setTimeout(() => {
        seedTimer = null;
        maybeSeedLocalState(roomId);
      }, SEED_DELAY_MS);
    } else if (status === 'connecting') {
      setCollabStatus('connecting');
    } else if (status === 'disconnected') {
      setCollabStatus('disconnected');
    }
  });

  provider.on('connection-error', () => {
    setCollabStatus('disconnected');
  });

  provider.on('sync', (isSynced) => {
    collabState.synced = unwrapEvent(isSynced);
    emitState();
    if (collabState.synced) pullRemoteState();
  });

  wireDocSync(ydoc!.getMap(PAYLOAD_KEY));
  emitState();
}

export function startCollabSession(roomId: string): void {
  if (collabState.roomId === roomId && provider) return;

  stopCollabSession();

  const wsUrl = getCollabWsUrl();
  const roomName = `kanban-board-${roomId}`;

  collabState.roomId = roomId;
  collabState.synced = false;
  collabState.peerCount = 0;
  collabState.transport = 'none';

  if (!wsUrl && !supportsBroadcastChannelSync()) {
    setCollabStatus('disconnected');
    emitState();
    return;
  }

  setCollabStatus('connecting');
  canPushLocal = isRoomHost(roomId);
  lastAppliedTs = 0;
  lastPushedJson = '';

  ydoc = new Y.Doc();

  if (wsUrl) {
    startWebSocketSession(roomId, roomName, wsUrl);
  } else {
    startBroadcastOnlySession(roomId, roomName);
  }
}

export function stopCollabSession(): void {
  detachStoreSync();
  provider?.destroy();
  provider = null;
  ydoc?.destroy();
  ydoc = null;
  lastPushedJson = '';
  lastAppliedTs = 0;
  canPushLocal = false;
  collabState.roomId = null;
  collabState.peerCount = 0;
  collabState.synced = false;
  collabState.transport = 'none';
  setCollabStatus('idle');
}

export function initCollaborationFromUrl(): void {
  const roomId = getRoomIdFromUrl();
  if (roomId) {
    startCollabSession(roomId);
  }
}

export function startNewShareSession(): void {
  const roomId = createRoomId();
  markRoomHost(roomId);
  navigateToRoom(roomId, true);
  startCollabSession(roomId);
}
