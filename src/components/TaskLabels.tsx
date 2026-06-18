import type { StatusLabel, Task } from '../types/kanban';
import {
  normalizeTask,
  PRIORITY_LABELS,
  priorityBadgeClass,
  STATUS_LABELS,
  statusBadgeClass,
  TYPE_LABELS,
  typeBadgeClass,
} from '../utils/labels';

interface TaskLabelsProps {
  task: Task;
  size?: 'sm' | 'md';
}

function badgeSize(size: 'sm' | 'md') {
  return size === 'sm'
    ? 'px-1.5 py-0.5 text-[9px]'
    : 'px-2 py-0.5 text-[10px]';
}

export function TaskLabels({ task, size = 'md' }: TaskLabelsProps) {
  const normalized = normalizeTask(task);
  const sizeClass = badgeSize(size);

  return (
    <div className="flex flex-wrap gap-1">
      <span
        className={`inline-flex shrink-0 items-center rounded-full font-semibold uppercase tracking-wide ring-1 ring-inset ${sizeClass} ${priorityBadgeClass[normalized.priority]}`}
      >
        {PRIORITY_LABELS[normalized.priority]}
      </span>

      {normalized.type && (
        <span
          className={`inline-flex shrink-0 items-center rounded-full font-medium ring-1 ring-inset ${sizeClass} ${typeBadgeClass[normalized.type]}`}
        >
          {TYPE_LABELS[normalized.type]}
        </span>
      )}

      {normalized.statusLabels.map((status: StatusLabel) => (
        <span
          key={status}
          className={`inline-flex shrink-0 items-center rounded-full font-medium ring-1 ring-inset ${sizeClass} ${statusBadgeClass[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
      ))}
    </div>
  );
}
