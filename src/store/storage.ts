import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/** localStorage wrapper that fails gracefully in private mode or when storage is blocked */
const browserStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Quota exceeded or storage disabled — state stays in memory for this session
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const kanbanPersistStorage = createJSONStorage(() => browserStorage);

export function isLocalStorageAvailable(): boolean {
  try {
    const probe = '__kanban_storage_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
