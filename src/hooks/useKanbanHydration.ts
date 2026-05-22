import { useEffect, useState } from 'react';
import { useKanbanStore } from '../store/kanbanStore';

/** True once persisted board data has been loaded from the browser (or defaults applied). */
export function useKanbanHydration(): boolean {
  const [hydrated, setHydrated] = useState(() => useKanbanStore.persist.hasHydrated());

  useEffect(() => {
    if (useKanbanStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    return useKanbanStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  return hydrated;
}
