import type { BoardState, Column, ColumnStage, Swimlane, SwimlaneKind, Task } from '../types/kanban';
import { createId } from './id';

export function encodeDroppableId(columnId: string, swimlaneId: string): string {
  return `${columnId}::${swimlaneId}`;
}

export function decodeDroppableId(id: string): { columnId: string; swimlaneId: string } | null {
  const sep = id.indexOf('::');
  if (sep === -1) return null;
  const columnId = id.slice(0, sep);
  const swimlaneId = id.slice(sep + 2);
  if (!columnId || !swimlaneId) return null;
  return { columnId, swimlaneId };
}

export function getCellTaskIds(
  board: BoardState,
  columnId: string,
  swimlaneId: string,
): string[] {
  const column = board.columns[columnId];
  if (!column) return [];
  return column.taskIds.filter((taskId) => board.tasks[taskId]?.swimlaneId === swimlaneId);
}

export function rebuildColumnTaskIds(
  board: BoardState,
  columnId: string,
  tasks: Record<string, Task>,
  cellOverride?: { swimlaneId: string; orderedIds: string[] },
): string[] {
  const column = board.columns[columnId];
  if (!column) return [];

  const ordered: string[] = [];
  for (const laneId of board.swimlaneOrder ?? []) {
    if (cellOverride?.swimlaneId === laneId) {
      ordered.push(...cellOverride.orderedIds);
    } else {
      ordered.push(
        ...column.taskIds.filter((taskId) => tasks[taskId]?.swimlaneId === laneId),
      );
    }
  }
  return ordered;
}

export function inferStageFromTitle(title: string): ColumnStage {
  const normalized = title.trim().toLowerCase();
  if (normalized.includes('backlog') || normalized === 'to do' || normalized === 'todo') {
    return 'backlog';
  }
  if (normalized === 'ready') return 'ready';
  if (normalized.includes('progress') || normalized.includes('doing')) return 'progress';
  if (normalized.includes('review') || normalized.includes('qa')) return 'review';
  if (normalized === 'done' || normalized.includes('complete')) return 'done';
  return 'custom';
}

export function defaultWipLimitForStage(stage: ColumnStage): number | null {
  if (stage === 'progress') return 3;
  if (stage === 'review') return 2;
  return null;
}

export function createSwimlane(title: string, kind: SwimlaneKind = 'custom'): Swimlane {
  const id = createId();
  return { id, title, kind };
}

export function createColumn(
  title: string,
  stage: ColumnStage = 'custom',
  wipLimit: number | null = defaultWipLimitForStage(stage),
): Column {
  return {
    id: createId(),
    title,
    stage,
    wipLimit,
    taskIds: [],
  };
}

export function hasReadyColumn(board: BoardState): boolean {
  return board.columnOrder.some((id) => board.columns[id]?.stage === 'ready');
}

export function getColumnTaskCount(
  board: BoardState,
  columnId: string,
  excludeTaskId?: string,
): number {
  return Object.values(board.tasks).filter(
    (task) => task.columnId === columnId && task.id !== excludeTaskId,
  ).length;
}

export function validateTaskMove(
  board: BoardState,
  taskId: string,
  destColumnId: string,
): string | null {
  const task = board.tasks[taskId];
  const sourceColumn = board.columns[task?.columnId ?? ''];
  const destColumn = board.columns[destColumnId];

  if (!task || !sourceColumn || !destColumn) {
    return 'Invalid move.';
  }

  if (task.columnId === destColumnId) {
    return null;
  }

  const sourceStage = sourceColumn.stage ?? 'custom';
  const destStage = destColumn.stage ?? 'custom';

  if (destStage === 'progress') {
    if (hasReadyColumn(board) && sourceStage !== 'ready') {
      return 'Pull from Ready  do not push work into In Progress.';
    }
    const alreadyInDest = task.columnId === destColumnId;
    const count = getColumnTaskCount(board, destColumnId, alreadyInDest ? taskId : undefined);
    if (destColumn.wipLimit != null && count >= destColumn.wipLimit) {
      return `WIP limit reached (${destColumn.wipLimit}). Finish work before pulling more into ${destColumn.title}.`;
    }
  }

  if (destStage === 'review') {
    if (sourceStage !== 'progress' && sourceStage !== 'review') {
      return 'Move tasks to Review only from In Progress.';
    }
    const alreadyInDest = task.columnId === destColumnId;
    const count = getColumnTaskCount(board, destColumnId, alreadyInDest ? taskId : undefined);
    if (destColumn.wipLimit != null && count >= destColumn.wipLimit) {
      return `WIP limit reached (${destColumn.wipLimit}) in ${destColumn.title}.`;
    }
  }

  if (destStage === 'done' && !['review', 'progress', 'done'].includes(sourceStage)) {
    return 'Complete work through Review or In Progress first.';
  }

  if (
    destColumn.wipLimit != null &&
    ['progress', 'review'].includes(destStage) === false &&
    destStage !== 'custom'
  ) {
    const count = getColumnTaskCount(board, destColumnId, task.columnId === destColumnId ? taskId : undefined);
    if (count >= destColumn.wipLimit) {
      return `WIP limit reached (${destColumn.wipLimit}) in ${destColumn.title}.`;
    }
  }

  return null;
}

export function stageLabel(stage: ColumnStage): string {
  switch (stage) {
    case 'backlog':
      return 'Backlog';
    case 'ready':
      return 'Ready (pull)';
    case 'progress':
      return 'In Progress';
    case 'review':
      return 'Review';
    case 'done':
      return 'Done';
    default:
      return 'Custom';
  }
}
