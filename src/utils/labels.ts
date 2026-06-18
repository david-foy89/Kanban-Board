import type { Priority, StatusLabel, Task, TaskType } from '../types/kanban';

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const TYPE_LABELS: Record<TaskType, string> = {
  feature: 'Feature',
  bug: 'Bug',
  design: 'Design',
  copy: 'Copy',
  research: 'Research',
  client: 'Client',
  marketing: 'Marketing',
  launch: 'Launch',
};

export const STATUS_LABELS: Record<StatusLabel, string> = {
  blocked: 'Blocked',
  'needs-approval': 'Needs Approval',
  'quick-win': 'Quick Win',
  'revenue-impact': 'Revenue Impact',
};

export const PRIORITIES: Priority[] = ['high', 'medium', 'low'];
export const TASK_TYPES: TaskType[] = [
  'feature',
  'bug',
  'design',
  'copy',
  'research',
  'client',
  'marketing',
  'launch',
];
export const STATUS_LABEL_OPTIONS: StatusLabel[] = [
  'blocked',
  'needs-approval',
  'quick-win',
  'revenue-impact',
];

export const priorityBadgeClass: Record<Priority, string> = {
  high: 'bg-rose-500/15 text-rose-400 ring-rose-500/25',
  medium: 'bg-amber-500/15 text-amber-400 ring-amber-500/25',
  low: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25',
};

export const typeBadgeClass: Record<TaskType, string> = {
  feature: 'bg-sky-500/15 text-sky-400 ring-sky-500/25',
  bug: 'bg-rose-500/15 text-rose-300 ring-rose-500/25',
  design: 'bg-violet-500/15 text-violet-300 ring-violet-500/25',
  copy: 'bg-amber-500/15 text-amber-300 ring-amber-500/25',
  research: 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/25',
  client: 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/25',
  marketing: 'bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/25',
  launch: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/25',
};

export const statusBadgeClass: Record<StatusLabel, string> = {
  blocked: 'bg-rose-500/12 text-rose-300 ring-rose-500/20',
  'needs-approval': 'bg-amber-500/12 text-amber-300 ring-amber-500/20',
  'quick-win': 'bg-emerald-500/12 text-emerald-300 ring-emerald-500/20',
  'revenue-impact': 'bg-yellow-500/12 text-yellow-300 ring-yellow-500/20',
};

export interface TaskLabelValues {
  priority: Priority;
  type: TaskType | null;
  statusLabels: StatusLabel[];
}

export const defaultTaskLabels = (): TaskLabelValues => ({
  priority: 'medium',
  type: null,
  statusLabels: [],
});

export interface NormalizedTask extends Task {
  type: TaskType | null;
  statusLabels: StatusLabel[];
}

export function normalizeTask(task: Task): NormalizedTask {
  return {
    ...task,
    type: task.type ?? null,
    statusLabels: task.statusLabels ?? [],
  };
}

export function taskLabelSearchText(task: Task): string {
  const normalized = normalizeTask(task);
  const parts = [
    PRIORITY_LABELS[normalized.priority],
    normalized.type ? TYPE_LABELS[normalized.type] : '',
    ...normalized.statusLabels.map((s) => STATUS_LABELS[s]),
  ];
  return parts.join(' ').toLowerCase();
}
