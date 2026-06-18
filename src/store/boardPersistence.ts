import type { BoardState, Project, ProjectsPersistedState } from '../types/kanban';
import { normalizeBoard, normalizeProject } from '../utils/boardMigration';
import { createId } from '../utils/id';

export const LEGACY_STORAGE_KEY = 'kanban-board-state';
export const PROJECTS_STORAGE_KEY = 'kanban-projects-v2';

/** @deprecated Use PROJECTS_STORAGE_KEY */
export const STORAGE_KEY = PROJECTS_STORAGE_KEY;

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

function isValidProject(data: unknown): data is Project {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.name !== 'string') return false;
  if (typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') return false;
  return isValidBoardState(data);
}

/** Parse and validate Firebase / remote sync payloads before applying to the store. */
export function normalizeRemoteWorkspace(data: unknown): ProjectsPersistedState | null {
  if (!data || typeof data !== 'object') return null;

  const record = data as Record<string, unknown>;
  if (!record.projects || typeof record.projects !== 'object') return null;

  const projects: Record<string, Project> = {};
  const now = new Date().toISOString();

  for (const [id, raw] of Object.entries(record.projects as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const project = raw as Record<string, unknown>;
    if (typeof project.name !== 'string') continue;

    try {
      projects[id] = normalizeProject({
        id,
        name: project.name,
        createdAt: typeof project.createdAt === 'string' ? project.createdAt : now,
        updatedAt: typeof project.updatedAt === 'string' ? project.updatedAt : now,
        columns: (project.columns as Project['columns']) ?? {},
        tasks: (project.tasks as Project['tasks']) ?? {},
        columnOrder: Array.isArray(project.columnOrder) ? project.columnOrder : [],
        swimlanes: project.swimlanes as Project['swimlanes'],
        swimlaneOrder: Array.isArray(project.swimlaneOrder)
          ? project.swimlaneOrder
          : undefined,
      });
    } catch {
      continue;
    }
  }

  if (Object.keys(projects).length === 0) return null;

  let activeProjectId =
    typeof record.activeProjectId === 'string' ? record.activeProjectId : '';
  if (!projects[activeProjectId]) {
    activeProjectId = Object.keys(projects)[0];
  }

  let projectOrder = Array.isArray(record.projectOrder)
    ? record.projectOrder.filter(
        (id): id is string => typeof id === 'string' && Boolean(projects[id]),
      )
    : [activeProjectId];

  if (projectOrder.length === 0) {
    projectOrder = [activeProjectId];
  }

  const normalized: ProjectsPersistedState = {
    version: 2,
    activeProjectId,
    projectOrder,
    projects,
  };

  return isValidProjectsState(normalized) ? normalized : null;
}

export function isValidProjectsState(data: unknown): data is ProjectsPersistedState {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  if (record.version !== 2) return false;
  if (typeof record.activeProjectId !== 'string') return false;
  if (!Array.isArray(record.projectOrder) || record.projectOrder.length === 0) return false;
  if (!record.projects || typeof record.projects !== 'object') return false;

  const projects = record.projects as Record<string, unknown>;
  for (const id of record.projectOrder) {
    const project = projects[id];
    if (!isValidProject(project) || project.id !== id) return false;
  }

  if (!projects[record.activeProjectId]) return false;
  return true;
}

export function loadLegacyBoardFromStorage(): BoardState | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (isValidBoardState(parsed)) {
      return normalizePersistedBoard(parsed)!;
    }
  } catch {
    // ignore
  }

  return null;
}

export function loadProjectsFromStorage(): ProjectsPersistedState | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidProjectsState(parsed)) return parsed;
      console.warn('[Kanban] Invalid projects data; clearing storage.');
      window.localStorage.removeItem(PROJECTS_STORAGE_KEY);
    }

    const legacy = loadLegacyBoardFromStorage();
    if (legacy) {
      const projectId = createId();
      const now = new Date().toISOString();
      const project: Project = normalizeProject({
        id: projectId,
        name: 'My Board',
        createdAt: now,
        updatedAt: now,
        ...legacy,
      });

      const migrated: ProjectsPersistedState = {
        version: 2,
        activeProjectId: projectId,
        projectOrder: [projectId],
        projects: { [projectId]: project },
      };

      saveProjectsToStorage(migrated);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return migrated;
    }
  } catch (error) {
    console.warn('[Kanban] Failed to read saved projects.', error);
    try {
      window.localStorage.removeItem(PROJECTS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return null;
}

export function saveProjectsToStorage(state: ProjectsPersistedState): void {
  if (!isLocalStorageAvailable()) return;

  try {
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[Kanban] Failed to save projects to local storage.', error);
  }
}

/** @deprecated Use loadProjectsFromStorage */
export function loadBoardFromStorage(): BoardState | null {
  const projects = loadProjectsFromStorage();
  if (!projects) return null;
  const active = projects.projects[projects.activeProjectId];
  if (!active) return null;
  return {
    columns: normalizeBoard(active).columns,
    tasks: normalizeBoard(active).tasks,
    columnOrder: active.columnOrder,
    swimlanes: normalizeBoard(active).swimlanes,
    swimlaneOrder: normalizeBoard(active).swimlaneOrder,
  };
}

/** @deprecated Use saveProjectsToStorage */
export function saveBoardToStorage(board: BoardState): void {
  const projects = loadProjectsFromStorage();
  if (!projects) return;

  const active = projects.projects[projects.activeProjectId];
  if (!active) return;

  saveProjectsToStorage({
    ...projects,
    projects: {
      ...projects.projects,
      [projects.activeProjectId]: {
        ...active,
        ...board,
        updatedAt: new Date().toISOString(),
      },
    },
  });
}
