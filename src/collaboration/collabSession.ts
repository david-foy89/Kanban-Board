import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import type { CollabPayload, CollabState, CollabStatus } from './types';
import { COLLAB_QUERY_PARAM } from './types';
import {
  applyRemoteWorkspace,
  buildWorkspaceSnapshot,
  isApplyingRemoteUpdate,
  useKanbanStore,
} from '../store/kanbanStore';
import { createId } from '../utils/id';

const SIGNALING_SERVERS = [
  'wss://signaling.yjs.dev',
  'wss://y-webrtc-signaling-eu.herokuapp.com',
  'wss://y-webrtc-signaling-us.herokuapp.com',
];

const PAYLOAD_KEY = 'workspace';

let ydoc: Y.Doc | null = null;
let provider: WebrtcProvider | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushedJson = '';
let clientId = '';
let unsubscribeStore: (() => void) | null = null;
let stateListeners = new Set<(state: CollabState) => void>();

const collabState: CollabState = {
  roomId: null,
  status: 'idle',
  peerCount: 0,
  synced: false,
};

function getClientId(): string {
  if (!clientId) {
    const stored = sessionStorage.getItem('kanban-collab-client-id');
    if (stored) {
      clientId = stored;
    } else {
      clientId = createId();
      sessionStorage.setItem('kanban-collab-client-id', clientId);
    }
  }
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

function buildPayload(): CollabPayload {
  return {
    v: 1,
    clientId: getClientId(),
    ts: Date.now(),
    data: buildWorkspaceSnapshot(useKanbanStore.getState()),
  };
}

function pushLocalState() {
  if (!ydoc || isApplyingRemoteUpdate()) return;

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

  ydoc = new Y.Doc();
  const ymap = ydoc.getMap(PAYLOAD_KEY);

  provider = new WebrtcProvider(`kanban-board-${roomId}`, ydoc, {
    signaling: SIGNALING_SERVERS,
  });

  provider.on('synced', ({ synced }: { synced: boolean }) => {
    collabState.synced = synced;
    emitState();

    if (synced) {
      const existing = ymap.get('json');
      if (typeof existing === 'string' && existing.length > 0) {
        applyRemoteJson(existing);
      } else {
        pushLocalState();
      }
      setCollabStatus('connected');
    }
  });

  provider.on('peers', ({ webrtcPeers }: { webrtcPeers: unknown[] }) => {
    collabState.peerCount = webrtcPeers.length;
    emitState();
  });

  ymap.observe(() => {
    const json = ymap.get('json');
    if (typeof json === 'string') {
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
  navigateToRoom(roomId);
  startCollabSession(roomId);
  return buildShareUrl(roomId);
}
