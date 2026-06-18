import type { ProjectsPersistedState } from '../types/kanban';

export interface CollabPayload {
  v: 1;
  clientId: string;
  ts: number;
  data: ProjectsPersistedState;
}

export type CollabStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

/** How updates travel between clients. */
export type CollabTransport = 'websocket' | 'broadcast' | 'none';

export interface CollabState {
  roomId: string | null;
  status: CollabStatus;
  peerCount: number;
  synced: boolean;
  transport: CollabTransport;
}

export const COLLAB_QUERY_PARAM = 'room';
export const COLLAB_HOST_PARAM = 'host';
