import { create } from 'zustand';
import type { BoardState, Column, Project, ProjectsPersistedState, Task } from '../types/kanban';
import type { TaskLabelValues } from '../utils/labels';
import {
  createEmptyKanbanBoardState,
  createKanbanBoardState,
  normalizeBoard,
  normalizeProject,
} from '../utils/boardMigration';
import {
  createColumn,
  decodeDroppableId,
  rebuildColumnTaskIds,
  validateTaskMove,
} from '../utils/kanbanRules';
import { createId } from '../utils/id';
import {
  loadProjectsFromStorage,
  PROJECTS_STORAGE_KEY,
  saveProjectsToStorage,
} from './boardPersistence';

export { PROJECTS_STORAGE_KEY as STORAGE_KEY };

export const createEmptyBoardState = createEmptyKanbanBoardState;
export const createInitialBoardState = createKanbanBoardState;

function createDefaultProject(name = 'My Board'): Project {
  const id = createId();
  const now = new Date().toISOString();
  const board = createKanbanBoardState();

  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    ...board,
  };
}

function createInitialStoreState() {
  const project = createDefaultProject();
  return {
    activeProjectId: project.id,
    projectOrder: [project.id],
    projects: { [project.id]: project },
    ...project,
  };
}

interface KanbanActions {
  moveTask: (
    taskId: string,
    sourceDroppableId: string,
    destDroppableId: string,
    sourceIndex: number,
    destIndex: number,
  ) => string | null;
  addTask: (
    columnId: string,
    swimlaneId: string,
    title: string,
    description: string,
    labels: TaskLabelValues,
  ) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string, columnId: string) => void;
  addColumn: (title: string) => void;
  renameColumn: (columnId: string, title: string) => void;
  setColumnWipLimit: (columnId: string, wipLimit: number | null) => void;
  deleteColumn: (columnId: string) => void;
  addSwimlane: (title: string) => void;
  renameSwimlane: (swimlaneId: string, title: string) => void;
  deleteSwimlane: (swimlaneId: string) => void;
  importBoard: (board: BoardState) => void;
  resetBoard: () => void;
  createProject: (name: string) => void;
  switchProject: (projectId: string) => void;
  renameProject: (projectId: string, name: string) => void;
  deleteProject: (projectId: string) => void;
}

export type KanbanStore = BoardState &
  KanbanActions & {
    activeProjectId: string;
    projectOrder: string[];
    projects: Record<string, Project>;
  };

export const boardSlice = (state: KanbanStore): BoardState =>
  normalizeBoard({
    columns: state.columns,
    tasks: state.tasks,
    columnOrder: state.columnOrder,
    swimlanes: state.swimlanes,
    swimlaneOrder: state.swimlaneOrder,
  });

export const activeProject = (state: KanbanStore): Project | undefined =>
  state.projects[state.activeProjectId];

function syncProjectBoard(
  state: KanbanStore,
  boardUpdate: Partial<BoardState>,
): Partial<KanbanStore> {
  const board = normalizeBoard({ ...boardSlice(state), ...boardUpdate });
  const active = state.projects[state.activeProjectId];
  if (!active) return board;

  return {
    ...board,
    projects: {
      ...state.projects,
      [state.activeProjectId]: {
        ...active,
        ...board,
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

function saveCurrentBoardToProjects(state: KanbanStore): Record<string, Project> {
  const board = boardSlice(state);
  const active = state.projects[state.activeProjectId];
  if (!active) return state.projects;

  return {
    ...state.projects,
    [state.activeProjectId]: {
      ...active,
      ...board,
      updatedAt: new Date().toISOString(),
    },
  };
}

function applyBoardToStore(project: Project): Partial<KanbanStore> {
  const board = normalizeBoard(project);
  return {
    columns: board.columns,
    tasks: board.tasks,
    columnOrder: board.columnOrder,
    swimlanes: board.swimlanes,
    swimlaneOrder: board.swimlaneOrder,
  };
}

const createStore = () =>
  create<KanbanStore>((set, get) => ({
    ...createInitialStoreState(),

    moveTask: (taskId, sourceDroppableId, destDroppableId, _sourceIndex, destIndex) => {
      const source = decodeDroppableId(sourceDroppableId);
      const dest = decodeDroppableId(destDroppableId);
      if (!source || !dest) return 'Invalid drop target.';

      const state = get();
      const error = validateTaskMove(boardSlice(state), taskId, dest.columnId);
      if (error) return error;

      const task = state.tasks[taskId];
      if (!task) return 'Task not found.';

      const sourceColumn = state.columns[source.columnId];
      const destColumn = state.columns[dest.columnId];
      if (!sourceColumn || !destColumn) return 'Invalid column.';

      const nextTasks: Record<string, Task> = {
        ...state.tasks,
        [taskId]: {
          ...task,
          columnId: dest.columnId,
          swimlaneId: dest.swimlaneId,
        },
      };

      let nextColumns = { ...state.columns };

      nextColumns[source.columnId] = {
        ...sourceColumn,
        taskIds: sourceColumn.taskIds.filter((id) => id !== taskId),
      };

      const destColAfterRemove =
        source.columnId === dest.columnId
          ? nextColumns[dest.columnId]
          : { ...destColumn, taskIds: destColumn.taskIds.filter((id) => id !== taskId) };

      const destCellIds = destColAfterRemove.taskIds.filter(
        (id) => nextTasks[id]?.swimlaneId === dest.swimlaneId,
      );
      destCellIds.splice(destIndex, 0, taskId);

      const boardForRebuild = {
        ...boardSlice(state),
        columns: { ...nextColumns, [dest.columnId]: destColAfterRemove },
        tasks: nextTasks,
      };

      nextColumns[dest.columnId] = {
        ...destColAfterRemove,
        taskIds: rebuildColumnTaskIds(boardForRebuild, dest.columnId, nextTasks, {
          swimlaneId: dest.swimlaneId,
          orderedIds: destCellIds,
        }),
      };

      set((s) => syncProjectBoard(s, { columns: nextColumns, tasks: nextTasks }));
      return null;
    },

    addTask: (columnId, swimlaneId, title, description, labels) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      const taskId = createId();
      const task: Task = {
        id: taskId,
        title: trimmedTitle,
        description: description.trim(),
        priority: labels.priority,
        type: labels.type,
        statusLabels: labels.statusLabels,
        columnId,
        swimlaneId,
        createdAt: new Date().toISOString(),
      };

      set((state) => {
        const column = state.columns[columnId];
        if (!column) return state;

        const nextTasks = { ...state.tasks, [taskId]: task };
        const cellIds = [...getCellIds(state, columnId, swimlaneId), taskId];
        const boardBase = { ...boardSlice(state), tasks: nextTasks };

        return syncProjectBoard(state, {
          tasks: nextTasks,
          columns: {
            ...state.columns,
            [columnId]: {
              ...column,
              taskIds: rebuildColumnTaskIds(boardBase, columnId, nextTasks, {
                swimlaneId,
                orderedIds: cellIds,
              }),
            },
          },
        });
      });
    },

    updateTask: (taskId, updates) => {
      set((state) => {
        const existing = state.tasks[taskId];
        if (!existing) return state;

        const nextTitle =
          updates.title !== undefined ? updates.title.trim() : existing.title;
        if (!nextTitle) return state;

        return syncProjectBoard(state, {
          tasks: {
            ...state.tasks,
            [taskId]: {
              ...existing,
              ...updates,
              title: nextTitle,
              description:
                updates.description !== undefined
                  ? updates.description.trim()
                  : existing.description,
            },
          },
        });
      });
    },

    deleteTask: (taskId, columnId) => {
      set((state) => {
        const column = state.columns[columnId];
        if (!column) return state;

        const { [taskId]: _removed, ...remainingTasks } = state.tasks;

        return syncProjectBoard(state, {
          tasks: remainingTasks,
          columns: {
            ...state.columns,
            [columnId]: {
              ...column,
              taskIds: column.taskIds.filter((id) => id !== taskId),
            },
          },
        });
      });
    },

    addColumn: (title) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      const column = createColumn(trimmedTitle, 'custom', null);

      set((state) =>
        syncProjectBoard(state, {
          columnOrder: [...state.columnOrder, column.id],
          columns: { ...state.columns, [column.id]: column },
        }),
      );
    },

    renameColumn: (columnId, title) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      set((state) => {
        const column = state.columns[columnId];
        if (!column) return state;

        return syncProjectBoard(state, {
          columns: {
            ...state.columns,
            [columnId]: { ...column, title: trimmedTitle },
          },
        });
      });
    },

    setColumnWipLimit: (columnId, wipLimit) => {
      set((state) => {
        const column = state.columns[columnId];
        if (!column) return state;

        return syncProjectBoard(state, {
          columns: {
            ...state.columns,
            [columnId]: { ...column, wipLimit },
          },
        });
      });
    },

    deleteColumn: (columnId) => {
      set((state) => {
        const column = state.columns[columnId];
        if (!column || state.columnOrder.length <= 1) return state;

        const nextTasks = { ...state.tasks };
        for (const taskId of column.taskIds) {
          delete nextTasks[taskId];
        }

        const { [columnId]: _removed, ...remainingColumns } = state.columns;

        return syncProjectBoard(state, {
          tasks: nextTasks,
          columns: remainingColumns,
          columnOrder: state.columnOrder.filter((id) => id !== columnId),
        });
      });
    },

    addSwimlane: (title) => {
      const trimmed = title.trim();
      if (!trimmed) return;

      const swimlane = { id: createId(), title: trimmed, kind: 'custom' as const };

      set((state) =>
        syncProjectBoard(state, {
          swimlaneOrder: [...(state.swimlaneOrder ?? []), swimlane.id],
          swimlanes: { ...(state.swimlanes ?? {}), [swimlane.id]: swimlane },
        }),
      );
    },

    renameSwimlane: (swimlaneId, title) => {
      const trimmed = title.trim();
      if (!trimmed) return;

      set((state) => {
        const lane = state.swimlanes?.[swimlaneId];
        if (!lane) return state;

        return syncProjectBoard(state, {
          swimlanes: {
            ...state.swimlanes,
            [swimlaneId]: { ...lane, title: trimmed },
          },
        });
      });
    },

    deleteSwimlane: (swimlaneId) => {
      set((state) => {
        const order = state.swimlaneOrder ?? [];
        if (order.length <= 1) return state;

        const fallbackId = order.find((id) => id !== swimlaneId);
        if (!fallbackId) return state;

        const nextTasks = { ...state.tasks };
        for (const task of Object.values(nextTasks)) {
          if (task.swimlaneId === swimlaneId) {
            nextTasks[task.id] = { ...task, swimlaneId: fallbackId };
          }
        }

        const { [swimlaneId]: _removed, ...remainingLanes } = state.swimlanes ?? {};

        const nextColumns: Record<string, Column> = {};
        for (const [colId, column] of Object.entries(state.columns)) {
          nextColumns[colId] = {
            ...column,
            taskIds: rebuildColumnTaskIds(
              {
                ...boardSlice(state),
                swimlaneOrder: order.filter((id) => id !== swimlaneId),
                tasks: nextTasks,
              },
              colId,
              nextTasks,
            ),
          };
        }

        return syncProjectBoard(state, {
          tasks: nextTasks,
          columns: nextColumns,
          swimlaneOrder: order.filter((id) => id !== swimlaneId),
          swimlanes: remainingLanes,
        });
      });
    },

    importBoard: (board) => {
      set((state) => syncProjectBoard(state, normalizeBoard(board)));
    },

    resetBoard: () => {
      set((state) => syncProjectBoard(state, createEmptyKanbanBoardState()));
    },

    createProject: (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      set((state) => {
        const id = createId();
        const now = new Date().toISOString();
        const board = createEmptyKanbanBoardState();
        const project: Project = {
          id,
          name: trimmed,
          createdAt: now,
          updatedAt: now,
          ...board,
        };

        const projects = {
          ...saveCurrentBoardToProjects(state),
          [id]: project,
        };

        return {
          activeProjectId: id,
          projectOrder: [...state.projectOrder, id],
          projects,
          ...board,
        };
      });
    },

    switchProject: (projectId) => {
      set((state) => {
        const target = state.projects[projectId];
        if (!target || projectId === state.activeProjectId) return state;

        const projects = saveCurrentBoardToProjects(state);
        const normalized = normalizeProject(target);

        return {
          activeProjectId: projectId,
          projects: { ...projects, [projectId]: normalized },
          ...applyBoardToStore(normalized),
        };
      });
    },

    renameProject: (projectId, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      set((state) => {
        const project = state.projects[projectId];
        if (!project) return state;

        return {
          projects: {
            ...state.projects,
            [projectId]: {
              ...project,
              name: trimmed,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },

    deleteProject: (projectId) => {
      set((state) => {
        if (state.projectOrder.length <= 1) return state;

        const projects = saveCurrentBoardToProjects(state);
        const { [projectId]: _removed, ...remaining } = projects;
        const projectOrder = state.projectOrder.filter((id) => id !== projectId);

        const nextActiveId =
          projectId === state.activeProjectId
            ? projectOrder[0]
            : state.activeProjectId;

        const nextProject = normalizeProject(remaining[nextActiveId]);
        if (!nextProject) return state;

        return {
          activeProjectId: nextActiveId,
          projectOrder,
          projects: { ...remaining, [nextActiveId]: nextProject },
          ...applyBoardToStore(nextProject),
        };
      });
    },
  }));

function getCellIds(state: KanbanStore, columnId: string, swimlaneId: string): string[] {
  const column = state.columns[columnId];
  if (!column) return [];
  return column.taskIds.filter((id) => state.tasks[id]?.swimlaneId === swimlaneId);
}

export const useKanbanStore = createStore();

let persistReady = false;
let lastSavedJson = '';
let applyingRemote = false;

function shouldPersistLocally(): boolean {
  if (typeof window === 'undefined') return true;
  return !new URLSearchParams(window.location.search).get('room');
}

export function isApplyingRemoteUpdate(): boolean {
  return applyingRemote;
}

export function buildWorkspaceSnapshot(state: KanbanStore): ProjectsPersistedState {
  return projectsPersistSlice(state);
}

export function applyRemoteWorkspace(data: ProjectsPersistedState): void {
  applyingRemote = true;
  try {
    const active = normalizeProject(data.projects[data.activeProjectId]);
    if (!active) return;

    const normalizedProjects = Object.fromEntries(
      Object.entries(data.projects).map(([id, p]) => [id, normalizeProject(p)]),
    ) as Record<string, Project>;

    const normalized = {
      version: 2 as const,
      activeProjectId: data.activeProjectId,
      projectOrder: data.projectOrder,
      projects: normalizedProjects,
    };

    lastSavedJson = JSON.stringify(normalized);
    const board = normalizeBoard(active);

    useKanbanStore.setState({
      activeProjectId: data.activeProjectId,
      projectOrder: data.projectOrder,
      projects: normalizedProjects,
      columns: board.columns,
      tasks: board.tasks,
      columnOrder: board.columnOrder,
      swimlanes: board.swimlanes ?? {},
      swimlaneOrder: board.swimlaneOrder ?? [],
    });
  } finally {
    applyingRemote = false;
  }
}

function projectsPersistSlice(state: KanbanStore): ProjectsPersistedState {
  const projects: Record<string, Project> = {};
  for (const [id, project] of Object.entries(state.projects)) {
    projects[id] = normalizeProject(project);
  }

  return {
    version: 2 as const,
    activeProjectId: state.activeProjectId,
    projectOrder: state.projectOrder,
    projects,
  };
}

/** Load saved projects from localStorage and subscribe to future saves */
export function initBoardPersistence(): void {
  if (persistReady || typeof window === 'undefined') return;
  persistReady = true;

  let isRestoring = true;

  useKanbanStore.subscribe((state) => {
    if (isRestoring || applyingRemote || !shouldPersistLocally()) return;

    const slice = projectsPersistSlice(state);
    const json = JSON.stringify(slice);
    if (json === lastSavedJson) return;

    lastSavedJson = json;
    saveProjectsToStorage(slice);
  });

  const saved = shouldPersistLocally() ? loadProjectsFromStorage() : null;
  if (saved) {
    const active = normalizeProject(saved.projects[saved.activeProjectId]);
    if (active) {
      const normalized = {
        ...saved,
        projects: Object.fromEntries(
          Object.entries(saved.projects).map(([id, p]) => [id, normalizeProject(p)]),
        ),
      };
      lastSavedJson = JSON.stringify(normalized);
      const board = normalizeBoard(active);
      useKanbanStore.setState({
        activeProjectId: saved.activeProjectId,
        projectOrder: saved.projectOrder,
        projects: normalized.projects,
        columns: board.columns,
        tasks: board.tasks,
        columnOrder: board.columnOrder,
        swimlanes: board.swimlanes ?? {},
        swimlaneOrder: board.swimlaneOrder ?? [],
      });
    }
  } else {
    const state = useKanbanStore.getState();
    const board = normalizeBoard(state);
    useKanbanStore.setState({
      columns: board.columns,
      tasks: board.tasks,
      columnOrder: board.columnOrder,
      swimlanes: board.swimlanes ?? {},
      swimlaneOrder: board.swimlaneOrder ?? [],
    });
  }

  isRestoring = false;
}
