import type { BoardState } from '../types/kanban';

export const STORAGE_KEY = 'kanban-board-state';

export function isLocalStorageAvailable(): boolean {
  try {
    const probe = '__kanban_storage_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Unwrap zustand persist payload or raw board JSON from older saves */
function normalizePersistedBoard(data: unknown): BoardState | null {
  if (!data || typeof data !== 'object') return null;

  const record = data as Record<string, unknown>;

  if (
    record.columns &&
    typeof record.columns === 'object' &&
    record.tasks &&
    typeof record.tasks === 'object' &&
    Array.isArray(record.columnOrder)
  ) {
    return record as unknown as BoardState;
  }

  if (record.state && typeof record.state === 'object') {
    return normalizePersistedBoard(record.state);
  }

  return null;
}

export function isValidBoardState(data: unknown): data is BoardState {
  const normalized = normalizePersistedBoard(data);
  if (!normalized) return false;

  const { columns, tasks, columnOrder } = normalized;

  if (!columns || typeof columns !== 'object' || Array.isArray(columns)) return false;
  if (!tasks || typeof tasks !== 'object' || Array.isArray(tasks)) return false;
  if (!Array.isArray(columnOrder) || columnOrder.length === 0) return false;

  for (const columnId of columnOrder) {
    const column = columns[columnId];
    if (!column || column.id !== columnId || !Array.isArray(column.taskIds)) return false;
  }

  return true;
}

export function loadBoardFromStorage(): BoardState | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (isValidBoardState(parsed)) {
      return normalizePersistedBoard(parsed)!;
    }

    console.warn('[Kanban] Invalid saved data; clearing local storage.');
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[Kanban] Failed to read saved board.', error);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return null;
}

export function saveBoardToStorage(board: BoardState): void {
  if (!isLocalStorageAvailable()) return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        columns: board.columns,
        tasks: board.tasks,
        columnOrder: board.columnOrder,
      }),
    );
  } catch (error) {
    console.warn('[Kanban] Failed to save board to local storage.', error);
  }
}
