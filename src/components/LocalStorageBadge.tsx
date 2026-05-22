import { useEffect, useState } from 'react';
import { isLocalStorageAvailable } from '../store/storage';
import { STORAGE_KEY } from '../store/boardPersistence';
import { useKanbanStore } from '../store/kanbanStore';

function readHasSavedData(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function LocalStorageBadge() {
  const available = isLocalStorageAvailable();
  const [saved, setSaved] = useState(readHasSavedData);

  useEffect(() => {
    setSaved(readHasSavedData());

    return useKanbanStore.subscribe(() => {
      setSaved(readHasSavedData());
    });
  }, []);

  if (!available) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400"
        title="Browser storage is unavailable. Changes last until you close this tab."
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
        Session only
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400"
      title={
        saved
          ? 'Your board is saved in this browser local storage.'
          : 'Changes are saved to this browser automatically.'
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
      {saved ? 'Saved in browser' : 'Auto-saves locally'}
    </span>
  );
}
