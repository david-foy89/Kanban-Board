import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoardState, Column, Priority, Task } from '../types/kanban';

const STORAGE_KEY = 'kanban-board-state';

const createId = (): string => crypto.randomUUID();

const initialBoardState = (): BoardState => {
  const todoId = createId();
  const inProgressId = createId();
  const doneId = createId();

  const task1Id = createId();
  const task2Id = createId();

  const now = new Date().toISOString();

  return {
    columnOrder: [todoId, inProgressId, doneId],
    columns: {
      [todoId]: { id: todoId, title: 'To Do', taskIds: [task1Id] },
      [inProgressId]: { id: inProgressId, title: 'In Progress', taskIds: [task2Id] },
      [doneId]: { id: doneId, title: 'Done', taskIds: [] },
    },
    tasks: {
      [task1Id]: {
        id: task1Id,
        title: 'Set up project',
        description: 'Initialize Vite, React, and Tailwind.',
        priority: 'high',
        columnId: todoId,
        createdAt: now,
      },
      [task2Id]: {
        id: task2Id,
        title: 'Design board layout',
        description: 'Sketch columns and card interactions.',
        priority: 'medium',
        columnId: inProgressId,
        createdAt: now,
      },
    },
  };
};

interface KanbanActions {
  moveTask: (
    taskId: string,
    sourceColId: string,
    destColId: string,
    sourceIndex: number,
    destIndex: number,
  ) => void;
  addTask: (
    columnId: string,
    title: string,
    description: string,
    priority: Priority,
  ) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string, columnId: string) => void;
  addColumn: (title: string) => void;
  deleteColumn: (columnId: string) => void;
}

type KanbanStore = BoardState & KanbanActions;

export const useKanbanStore = create<KanbanStore>()(
  persist(
    (set) => ({
      ...initialBoardState(),

      moveTask: (taskId, sourceColId, destColId, sourceIndex, destIndex) => {
        set((state) => {
          const sourceColumn = state.columns[sourceColId];
          const destColumn = state.columns[destColId];
          if (!sourceColumn || !destColumn) return state;

          const sourceTaskIds = [...sourceColumn.taskIds];
          const destTaskIds =
            sourceColId === destColId ? sourceTaskIds : [...destColumn.taskIds];

          const [removed] = sourceTaskIds.splice(sourceIndex, 1);
          if (removed !== taskId) return state;

          destTaskIds.splice(destIndex, 0, taskId);

          const nextColumns: Record<string, Column> = {
            ...state.columns,
            [sourceColId]: { ...sourceColumn, taskIds: sourceTaskIds },
          };

          if (sourceColId !== destColId) {
            nextColumns[destColId] = { ...destColumn, taskIds: destTaskIds };
          } else {
            nextColumns[sourceColId] = { ...sourceColumn, taskIds: destTaskIds };
          }

          const task = state.tasks[taskId];
          const nextTasks =
            sourceColId !== destColId && task
              ? {
                  ...state.tasks,
                  [taskId]: { ...task, columnId: destColId },
                }
              : state.tasks;

          return { columns: nextColumns, tasks: nextTasks };
        });
      },

      addTask: (columnId, title, description, priority) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        const taskId = createId();
        const task: Task = {
          id: taskId,
          title: trimmedTitle,
          description: description.trim(),
          priority,
          columnId,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          const column = state.columns[columnId];
          if (!column) return state;

          return {
            tasks: { ...state.tasks, [taskId]: task },
            columns: {
              ...state.columns,
              [columnId]: {
                ...column,
                taskIds: [...column.taskIds, taskId],
              },
            },
          };
        });
      },

      updateTask: (taskId, updates) => {
        set((state) => {
          const existing = state.tasks[taskId];
          if (!existing) return state;

          const nextTitle =
            updates.title !== undefined ? updates.title.trim() : existing.title;
          if (!nextTitle) return state;

          return {
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
          };
        });
      },

      deleteTask: (taskId, columnId) => {
        set((state) => {
          const column = state.columns[columnId];
          if (!column) return state;

          const { [taskId]: _removed, ...remainingTasks } = state.tasks;

          return {
            tasks: remainingTasks,
            columns: {
              ...state.columns,
              [columnId]: {
                ...column,
                taskIds: column.taskIds.filter((id) => id !== taskId),
              },
            },
          };
        });
      },

      addColumn: (title) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        const columnId = createId();
        const column: Column = { id: columnId, title: trimmedTitle, taskIds: [] };

        set((state) => ({
          columnOrder: [...state.columnOrder, columnId],
          columns: { ...state.columns, [columnId]: column },
        }));
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

          return {
            tasks: nextTasks,
            columns: remainingColumns,
            columnOrder: state.columnOrder.filter((id) => id !== columnId),
          };
        });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        columns: state.columns,
        tasks: state.tasks,
        columnOrder: state.columnOrder,
      }),
    },
  ),
);
