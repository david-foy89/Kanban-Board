import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { CollabPayload, CollabState, CollabStatus } from './types';
import { COLLAB_QUERY_PARAM } from './types';
import {
  applyRemoteWorkspace,
  buildWorkspaceSnapshot,
  isApplyingRemoteUpdate,
  useKanbanStore,
} from '../store/kanbanStore';
import { createId } from '../utils/id';

/** Public Yjs demo server — fine for share links; override with VITE_COLLAB_WS_URL for production. */
const WS_SERVER =
  (import.meta.env.VITE_COLLAB_WS_URL as string | undefined)?.trim() ||
  'wss://demos.yjs.dev/ws';

const HOST_ROOM_KEY = 'kanban-collab-host-room';
const PAYLOAD_KEY = 'workspace';
const SEED_DELAY_MS = 600;

let ydoc: Y.Doc | null = null;
let provider: WebsocketProvider | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let seedTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushedJson = '';
let canPushLocal = false;
let unsubscribeStore: (() => void) | null = null;
let stateListeners = new Set<(state: CollabState) => void>();

const collabState: CollabState = {
  roomId: null,
  status: 'idle',
  peerCount: 0,
  synced: false,
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

function pushLocalState(force = false) {
  if (!ydoc || isApplyingRemoteUpdate()) return;
  if (!force && !canPushLocal) return;

  const payload = buildPayload();
  const json = JSON.stringify(payload);
  if (json === lastPushedJson) return;

  lastPushedJson = json;
  ydoc.getMap(PAYLOAD_KEY).set('json', json);
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    pushLocalState();
  }, 120);
}

function applyRemoteJson(json: string) {
  if (!json || json === lastPushedJson) return;

  let payload: CollabPayload;
  try {
    payload = JSON.parse(json) as CollabPayload;
  } catch {
    return;
  }

  if (payload.v !== 1 || !payload.data?.projects) return;

  lastPushedJson = json;
  applyRemoteWorkspace(payload.data);
  canPushLocal = true;
}

function maybeSeedLocalState(roomId: string) {
  if (!ydoc) return;

  const ymap = ydoc.getMap(PAYLOAD_KEY);
  const existing = ymap.get('json');

  if (typeof existing === 'string' && existing.length > 0) {
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
}

export function getRoomIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const roomId = new URLSearchParams(window.location.search).get(COLLAB_QUERY_PARAM);
  return roomId?.trim() || null;
}

export function buildShareUrl(roomId: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set(COLLAB_QUERY_PARAM, roomId);
  return url.toString();
}

export function createRoomId(): string {
  return createId().replace(/-/g, '').slice(0, 12);
}

export function navigateToRoom(roomId: string): void {
  const url = buildShareUrl(roomId);
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

export function startCollabSession(roomId: string): void {
  if (collabState.roomId === roomId && provider) return;

  stopCollabSession();

  collabState.roomId = roomId;
  collabState.synced = false;
  collabState.peerCount = 0;
  setCollabStatus('connecting');

  canPushLocal = isRoomHost(roomId);

  ydoc = new Y.Doc();
  const ymap = ydoc.getMap(PAYLOAD_KEY);

  provider = new WebsocketProvider(WS_SERVER, `kanban-board-${roomId}`, ydoc);

  provider.on('status', (event) => {
    const { status } = unwrapEvent(event);

    if (status === 'connected') {
      setCollabStatus('connected');
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
  });

  provider.awareness.on('change', () => {
    if (!provider) return;
    collabState.peerCount = Math.max(0, provider.awareness.getStates().size - 1);
    emitState();
  });

  ymap.observe(() => {
    const json = ymap.get('json');
    if (typeof json === 'string' && json.length > 0) {
      applyRemoteJson(json);
    }
  });

  attachStoreSync();
  emitState();
}

export function stopCollabSession(): void {
  detachStoreSync();
  provider?.destroy();
  provider = null;
  ydoc?.destroy();
  ydoc = null;
  lastPushedJson = '';
  canPushLocal = false;
  collabState.roomId = null;
  collabState.peerCount = 0;
  collabState.synced = false;
  setCollabStatus('idle');
}

export function initCollaborationFromUrl(): void {
  const roomId = getRoomIdFromUrl();
  if (roomId) {
    startCollabSession(roomId);
  }
}

export function startNewShareSession(): string {
  const roomId = createRoomId();
  markRoomHost(roomId);
  navigateToRoom(roomId);
  startCollabSession(roomId);
  return buildShareUrl(roomId);
}
