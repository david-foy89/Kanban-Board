import type { BoardState, Column, Project, Swimlane, Task } from '../types/kanban';
import { createId } from './id';
import {
  createColumn,
  createSwimlane,
  defaultWipLimitForStage,
  inferStageFromTitle,
} from './kanbanRules';

const DEFAULT_SWIMLANES: Array<{ title: string; kind: Swimlane['kind'] }> = [
  { title: 'Fast Track', kind: 'fast-track' },
  { title: 'Standard', kind: 'standard' },
];

function defaultSwimlanes(): { swimlanes: Record<string, Swimlane>; swimlaneOrder: string[] } {
  const swimlanes: Record<string, Swimlane> = {};
  const swimlaneOrder: string[] = [];

  for (const lane of DEFAULT_SWIMLANES) {
    const swimlane = createSwimlane(lane.title, lane.kind);
    swimlanes[swimlane.id] = swimlane;
    swimlaneOrder.push(swimlane.id);
  }

  return { swimlanes, swimlaneOrder };
}

function normalizeColumn(column: Column): Column {
  const stage = column.stage ?? inferStageFromTitle(column.title);
  return {
    ...column,
    stage,
    taskIds: column.taskIds ?? [],
    wipLimit:
      column.wipLimit !== undefined
        ? column.wipLimit
        : defaultWipLimitForStage(stage),
  };
}

function normalizeTask(task: Task, defaultSwimlaneId: string): Task {
  return {
    ...task,
    swimlaneId: task.swimlaneId ?? defaultSwimlaneId,
  };
}

export function normalizeBoard(board: BoardState): BoardState {
  let swimlanes = board.swimlanes ?? {};
  let swimlaneOrder = board.swimlaneOrder ?? [];

  if (swimlaneOrder.length === 0) {
    const created = defaultSwimlanes();
    swimlanes = created.swimlanes;
    swimlaneOrder = created.swimlaneOrder;
  }

  const defaultSwimlaneId =
    swimlaneOrder.find((id) => swimlanes[id]?.kind === 'standard') ?? swimlaneOrder[0];

  const columns: Record<string, Column> = {};
  for (const [id, column] of Object.entries(board.columns)) {
    columns[id] = normalizeColumn(column);
  }

  const tasks: Record<string, Task> = {};
  for (const [id, task] of Object.entries(board.tasks)) {
    tasks[id] = normalizeTask(task, defaultSwimlaneId);
  }

  return {
    ...board,
    columns,
    tasks,
    columnOrder: board.columnOrder ?? [],
    swimlanes,
    swimlaneOrder,
  };
}

export function createKanbanBoardState(): BoardState {
  const backlog = createColumn('Backlog', 'backlog', null);
  const ready = createColumn('Ready', 'ready', null);
  const progress = createColumn('In Progress', 'progress', 3);
  const review = createColumn('Review', 'review', 2);
  const done = createColumn('Done', 'done', null);

  const { swimlanes, swimlaneOrder } = defaultSwimlanes();
  const standardLaneId =
    swimlaneOrder.find((id) => swimlanes[id]?.kind === 'standard') ?? swimlaneOrder[0];
  const fastLaneId =
    swimlaneOrder.find((id) => swimlanes[id]?.kind === 'fast-track') ?? swimlaneOrder[0];

  const task1Id = createId();
  const task2Id = createId();
  const task3Id = createId();
  const now = new Date().toISOString();

  return normalizeBoard({
    columnOrder: [backlog.id, ready.id, progress.id, review.id, done.id],
    columns: {
      [backlog.id]: { ...backlog, taskIds: [task1Id] },
      [ready.id]: { ...ready, taskIds: [task3Id] },
      [progress.id]: { ...progress, taskIds: [task2Id] },
      [review.id]: review,
      [done.id]: done,
    },
    swimlanes,
    swimlaneOrder,
    tasks: {
      [task1Id]: {
        id: task1Id,
        title: 'Set up project',
        description: 'Initialize Vite, React, and Tailwind.',
        priority: 'high',
        type: 'feature',
        statusLabels: ['quick-win'],
        columnId: backlog.id,
        swimlaneId: standardLaneId,
        createdAt: now,
      },
      [task2Id]: {
        id: task2Id,
        title: 'Design board layout',
        description: 'Sketch columns, swimlanes, and WIP limits.',
        priority: 'medium',
        type: 'design',
        statusLabels: ['needs-approval'],
        columnId: progress.id,
        swimlaneId: standardLaneId,
        createdAt: now,
      },
      [task3Id]: {
        id: task3Id,
        title: 'Fix production login bug',
        description: 'Urgent ù fast track lane.',
        priority: 'high',
        type: 'bug',
        statusLabels: ['blocked', 'revenue-impact'],
        columnId: ready.id,
        swimlaneId: fastLaneId,
        createdAt: now,
      },
    },
  });
}

export function createEmptyKanbanBoardState(): BoardState {
  const backlog = createColumn('Backlog', 'backlog', null);
  const ready = createColumn('Ready', 'ready', null);
  const progress = createColumn('In Progress', 'progress', 3);
  const review = createColumn('Review', 'review', 2);
  const done = createColumn('Done', 'done', null);
  const { swimlanes, swimlaneOrder } = defaultSwimlanes();

  return normalizeBoard({
    columnOrder: [backlog.id, ready.id, progress.id, review.id, done.id],
    columns: {
      [backlog.id]: backlog,
      [ready.id]: ready,
      [progress.id]: progress,
      [review.id]: review,
      [done.id]: done,
    },
    swimlanes,
    swimlaneOrder,
    tasks: {},
  });
}

export function normalizeProject(project: Project): Project {
  const board = normalizeBoard(project);
  return { ...project, ...board };
}
