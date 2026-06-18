import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CollabState } from './types';
import { getCollabState, subscribeCollabState } from './collabSession';

const CollaborationContext = createContext<CollabState>({
  roomId: null,
  status: 'idle',
  peerCount: 0,
  synced: false,
  transport: 'none',
});

export function CollaborationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CollabState>(getCollabState);

  useEffect(() => subscribeCollabState(setState), []);

  const value = useMemo(() => state, [state]);

  return (
    <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  return useContext(CollaborationContext);
}
