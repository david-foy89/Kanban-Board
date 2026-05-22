import { useEffect, useState } from 'react';
import { useKanbanStore } from '../store/kanbanStore';

const HYDRATION_TIMEOUT_MS = 2000;

/**
 * True once persisted board data has been loaded from the browser (or defaults applied).
 * Includes a timeout fallback so a failed rehydrate never blocks the UI forever.
 */
export function useKanbanHydration(): boolean {
  const [hydrated, setHydrated] = useState(() => useKanbanStore.persist.hasHydrated());

  useEffect(() => {
    if (useKanbanStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    const unsubscribe = useKanbanStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    void useKanbanStore.persist.rehydrate();

    const timeoutId = window.setTimeout(() => {
      if (!useKanbanStore.persist.hasHydrated()) {
        console.warn(
          '[Kanban] Storage hydration timed out; showing board with current in-memory state.',
        );
        setHydrated(true);
      }
    }, HYDRATION_TIMEOUT_MS);

    return () => {
      unsubscribe();
      window.clearTimeout(timeoutId);
    };
  }, []);

  return hydrated;
}
