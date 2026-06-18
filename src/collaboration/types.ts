import type { ProjectsPersistedState } from '../types/kanban';

export interface CollabPayload {
  v: 1;
  clientId: string;
  ts: number;
  data: ProjectsPersistedState;
}

export type CollabStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

/** How updates travel between clients. */
export type CollabTransport = 'firebase' | 'none';

export interface CollabState {
  roomId: string | null;
  status: CollabStatus;
  peerCount: number;
  synced: boolean;
  transport: CollabTransport;
  shareSummary: string | null;
}

export const COLLAB_QUERY_PARAM = 'room';
export const COLLAB_HOST_PARAM = 'host';

export type ShareScopeMode = 'all' | 'current' | 'selected';

/** Which projects are included in a live share link. */
export interface ShareScope {
  mode: ShareScopeMode;
  /** For `current`: one id. For `selected`: chosen ids. For `all`: optional snapshot (ignored ù uses live list). */
  projectIds: string[];
}
