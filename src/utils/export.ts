import type { BoardState } from '../types/kanban';
import { normalizeBoard } from './boardMigration';
import { isValidBoardState } from '../store/boardPersistence';
import { normalizeTask, PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS } from './labels';

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function boardFilename(ext: string, projectName?: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = projectName
    ? projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'project'
    : 'kanban-board';
  return `${slug}-${date}.${ext}`;
}

export function downloadBoardJson(board: BoardState, projectName?: string): void {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    projectName,
    columns: board.columns,
    tasks: board.tasks,
    columnOrder: board.columnOrder,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  triggerDownload(blob, boardFilename('json', projectName));
}

export function boardToMarkdown(board: BoardState, projectName?: string): string {
  const normalized = normalizeBoard(board);
  const lines: string[] = [
    `# ${projectName ?? 'Kanban Board'}`,
    '',
    `Exported ${new Date().toLocaleString()}`,
    '',
  ];

  for (const swimlaneId of normalized.swimlaneOrder ?? []) {
    const swimlane = normalized.swimlanes?.[swimlaneId];
    if (!swimlane) continue;

    lines.push(`## Swimlane: ${swimlane.title}`, '');

    for (const columnId of normalized.columnOrder) {
      const column = normalized.columns[columnId];
      if (!column) continue;

      const laneTasks = column.taskIds
        .map((id) => normalized.tasks[id])
        .filter((task) => task?.swimlaneId === swimlaneId);

      lines.push(`### ${column.title}`, '');

      if (laneTasks.length === 0) {
        lines.push('_No tasks_', '');
        continue;
      }

      for (const raw of laneTasks) {
        if (!raw) continue;
        const task = normalizeTask(raw);

        lines.push(`#### ${task.title}`);
        lines.push(`- **Priority:** ${PRIORITY_LABELS[task.priority]}`);
        if (task.type) {
          lines.push(`- **Type:** ${TYPE_LABELS[task.type]}`);
        }
        if (task.statusLabels.length > 0) {
          lines.push(
            `- **Status:** ${task.statusLabels.map((s) => STATUS_LABELS[s]).join(', ')}`,
          );
        }
        if (task.description) {
          lines.push(`- **Description:** ${task.description}`);
        }
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

export function downloadBoardMarkdown(board: BoardState, projectName?: string): void {
  const blob = new Blob([boardToMarkdown(board, projectName)], { type: 'text/markdown' });
  triggerDownload(blob, boardFilename('md', projectName));
}

export async function parseBoardImportFile(file: File): Promise<BoardState> {
  const text = await file.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }

  const record = parsed as Record<string, unknown>;
  const candidate =
    record.columns && record.tasks && record.columnOrder
      ? parsed
      : record.state ?? parsed;

  if (!isValidBoardState(candidate)) {
    throw new Error('File does not contain a valid Kanban board.');
  }

  const board = candidate as BoardState;
  return {
    columns: board.columns,
    tasks: board.tasks,
    columnOrder: board.columnOrder,
  };
}

export function getBoardStats(board: BoardState) {
  const taskCount = Object.keys(board.tasks).length;
  const columnCount = board.columnOrder.length;
  const byPriority = { low: 0, medium: 0, high: 0 } as Record<
    'low' | 'medium' | 'high',
    number
  >;

  for (const task of Object.values(board.tasks)) {
    byPriority[task.priority]++;
  }

  return { taskCount, columnCount, byPriority };
}
