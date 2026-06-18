import {
  get,
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
  type Database,
  type Unsubscribe,
} from 'firebase/database';
import type { CollabPayload, CollabState, CollabStatus } from './types';
import { COLLAB_HOST_PARAM, COLLAB_QUERY_PARAM } from './types';
import {
  applyRemoteWorkspace,
  buildWorkspaceSnapshot,
  isApplyingRemoteUpdate,
  useKanbanStore,
} from '../store/kanbanStore';
import { createId } from '../utils/id';
import { getFirebaseDatabase, isFirebaseConfigured } from './firebaseConfig';

const HOST_ROOM_KEY = 'kanban-collab-host-room';
const SEED_DELAY_MS = 400;

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let seedTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushedTs = 0;
let lastAppliedTs = 0;
let canPushLocal = false;
let unsubscribeStore: (() => void) | null = null;
let workspaceUnsub: Unsubscribe | null = null;
let presenceUnsub: Unsubscribe | null = null;
let activeDb: Database | null = null;
let activeRoomId: string | null = null;
let stateListeners = new Set<(state: CollabState) => void>();

const collabState: CollabState = {
  roomId: null,
  status: 'idle',
  peerCount: 0,
  synced: false,
  transport: 'none',
};

export { isFirebaseConfigured as isCollabConfigured };

export function isCollabServerConfigured(): boolean {
  return isFirebaseConfigured();
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
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get(COLLAB_HOST_PARAM) === '1') return true;
  return sessionStorage.getItem(HOST_ROOM_KEY) === roomId;
}

function markRoomHost(roomId: string): void {
  sessionStorage.setItem(HOST_ROOM_KEY, roomId);
}

function workspaceRef(db: Database, roomId: string) {
  return ref(db, `rooms/${roomId}/workspace`);
}

function presenceRootRef(db: Database, roomId: string) {
  return ref(db, `rooms/${roomId}/presence`);
}

function clientPresenceRef(db: Database, roomId: string, clientId: string) {
  return ref(db, `rooms/${roomId}/presence/${clientId}`);
}

function buildPayload(): CollabPayload {
  return {
    v: 1,
    clientId: getClientId(),
    ts: Date.now(),
    data: buildWorkspaceSnapshot(useKanbanStore.getState()),
  };
}

function applyRemotePayload(payload: CollabPayload | null) {
  if (!payload || payload.v !== 1 || !payload.data?.projects) return;

  const isOwn = payload.clientId === getClientId();
  if (isOwn && payload.ts <= lastAppliedTs) return;
  if (payload.ts <= lastAppliedTs) return;

  lastAppliedTs = payload.ts;
  applyRemoteWorkspace(payload.data);
  canPushLocal = true;
}

async function pushLocalState(force = false) {
  if (!activeDb || !activeRoomId || isApplyingRemoteUpdate()) return;
  if (!force && !canPushLocal) return;

  const payload = buildPayload();
  if (!force && payload.ts <= lastPushedTs) return;

  lastPushedTs = payload.ts;
  await set(workspaceRef(activeDb, activeRoomId), payload);
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushLocalState();
  }, 120);
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

async function maybeSeedLocalState(roomId: string) {
  if (!activeDb) return;

  const snap = await get(workspaceRef(activeDb, roomId));
  const existing = snap.val() as CollabPayload | null;

  if (existing) {
    applyRemotePayload(existing);
    return;
  }

  if (isRoomHost(roomId)) {
    canPushLocal = true;
    await pushLocalState(true);
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

async function startCollabSessionAsync(roomId: string): Promise<void> {
  if (collabState.roomId === roomId && workspaceUnsub) return;

  await stopCollabSession();

  collabState.roomId = roomId;
  collabState.synced = false;
  collabState.peerCount = 0;
  collabState.transport = 'none';

  if (!isFirebaseConfigured()) {
    setCollabStatus('disconnected');
    emitState();
    return;
  }

  const db = getFirebaseDatabase();
  if (!db) {
    setCollabStatus('disconnected');
    emitState();
    return;
  }

  activeDb = db;
  activeRoomId = roomId;
  collabState.transport = 'firebase';
  setCollabStatus('connecting');

  canPushLocal = isRoomHost(roomId);
  lastAppliedTs = 0;
  lastPushedTs = 0;

  const clientId = getClientId();
  const myPresence = clientPresenceRef(db, roomId, clientId);

  try {
    await set(myPresence, { at: Date.now() });
    onDisconnect(myPresence).remove();

    presenceUnsub = onValue(presenceRootRef(db, roomId), (snap) => {
      const val = snap.val() as Record<string, unknown> | null;
      collabState.peerCount = val ? Math.max(0, Object.keys(val).length - 1) : 0;
      emitState();
    });

    workspaceUnsub = onValue(workspaceRef(db, roomId), (snap) => {
      applyRemotePayload(snap.val() as CollabPayload | null);
      collabState.synced = true;
      if (collabState.status !== 'connected') setCollabStatus('connected');
      emitState();
    });

    attachStoreSync();

    seedTimer = setTimeout(() => {
      seedTimer = null;
      void maybeSeedLocalState(roomId);
    }, SEED_DELAY_MS);

    setCollabStatus('connected');
    collabState.synced = true;
    emitState();
  } catch (error) {
    console.error('[Kanban] Firebase collab failed:', error);
    setCollabStatus('disconnected');
    emitState();
  }
}

export function startCollabSession(roomId: string): void {
  void startCollabSessionAsync(roomId);
}

export async function stopCollabSession(): Promise<void> {
  detachStoreSync();

  if (activeDb && activeRoomId) {
    try {
      await remove(clientPresenceRef(activeDb, activeRoomId, getClientId()));
    } catch {
      // ignore cleanup errors
    }
  }

  workspaceUnsub?.();
  presenceUnsub?.();
  workspaceUnsub = null;
  presenceUnsub = null;
  activeDb = null;
  activeRoomId = null;

  lastPushedTs = 0;
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
