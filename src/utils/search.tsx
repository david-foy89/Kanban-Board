import type { ReactNode } from 'react';
import type { Task } from '../types/kanban';
import { taskLabelSearchText } from '../utils/labels';

export function taskMatchesSearch(task: Task, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return (
    task.title.toLowerCase().includes(q) ||
    task.description.toLowerCase().includes(q) ||
    taskLabelSearchText(task).includes(q)
  );
}

export function highlightText(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;

  const lowerText = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  const index = lowerText.indexOf(lowerQ);
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-violet-500/25 px-0.5 text-inherit">
        {text.slice(index, index + q.length)}
      </mark>
      {text.slice(index + q.length)}
    </>
  );
}
