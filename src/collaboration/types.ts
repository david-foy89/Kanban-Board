import type { ProjectsPersistedState } from '../types/kanban';

export interface CollabPayload {
  v: 1;
  clientId: string;
  ts: number;
  data: ProjectsPersistedState;
}

export type CollabStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

export interface CollabState {
  roomId: string | null;
  status: CollabStatus;
  peerCount: number;
  synced: boolean;
}

export const COLLAB_QUERY_PARAM = 'room';
export const COLLAB_HOST_PARAM = 'host';
