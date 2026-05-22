import type { Priority } from '../types/kanban';

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const priorityBadgeClass: Record<Priority, string> = {
  low: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25',
  medium: 'bg-amber-500/15 text-amber-400 ring-amber-500/25',
  high: 'bg-rose-500/15 text-rose-400 ring-rose-500/25',
};
