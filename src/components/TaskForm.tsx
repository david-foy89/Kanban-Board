import { useEffect, useId, useRef, useState } from 'react';
import type { Priority, StatusLabel, TaskType } from '../types/kanban';
import {
  defaultTaskLabels,
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABEL_OPTIONS,
  STATUS_LABELS,
  TASK_TYPES,
  TYPE_LABELS,
  type TaskLabelValues,
} from '../utils/labels';

export type { TaskLabelValues };

interface TaskFormProps {
  mode: 'create' | 'edit';
  initialTitle?: string;
  initialDescription?: string;
  initialLabels?: TaskLabelValues;
  onSubmit: (title: string, description: string, labels: TaskLabelValues) => void;
  onCancel: () => void;
}

function chipClass(selected: boolean) {
  return selected
    ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
    : 'border-zinc-700 text-zinc-400 hover:border-zinc-600';
}

export function TaskForm({
  mode,
  initialTitle = '',
  initialDescription = '',
  initialLabels = defaultTaskLabels(),
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [priority, setPriority] = useState<Priority>(initialLabels.priority);
  const [type, setType] = useState<TaskType | null>(initialLabels.type);
  const [statusLabels, setStatusLabels] = useState<StatusLabel[]>(initialLabels.statusLabels);
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const toggleStatus = (status: StatusLabel) => {
    setStatusLabels((current) =>
      current.includes(status) ? current.filter((s) => s !== status) : [...current, status],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Title is required');
      return;
    }
    setTitleError(null);
    onSubmit(trimmed, description, { priority, type, statusLabels });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-700/80 bg-zinc-900 p-3 shadow-lg shadow-black/20"
      aria-labelledby={`${formId}-heading`}
    >
      <h3 id={`${formId}-heading`} className="sr-only">
        {mode === 'create' ? 'New task' : 'Edit task'}
      </h3>

      <label htmlFor={`${formId}-title`} className="sr-only">
        Title
      </label>
      <input
        ref={titleRef}
        id={`${formId}-title`}
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (titleError) setTitleError(null);
        }}
        placeholder="Task title"
        maxLength={120}
        className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-base text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/25 sm:py-2 sm:text-sm"
        aria-invalid={titleError ? true : undefined}
        aria-describedby={titleError ? `${formId}-title-error` : undefined}
      />
      {titleError && (
        <p id={`${formId}-title-error`} className="mt-1 text-xs text-rose-400" role="alert">
          {titleError}
        </p>
      )}

      <label htmlFor={`${formId}-description`} className="sr-only">
        Description
      </label>
      <textarea
        id={`${formId}-description`}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={3}
        maxLength={500}
        className="mt-2 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-base text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/25 sm:py-2 sm:text-sm"
      />

      <fieldset className="mt-3">
        <legend className="mb-1.5 text-xs font-medium text-zinc-500">Priority</legend>
        <div className="flex flex-wrap gap-1.5">
          {PRIORITIES.map((p) => (
            <label
              key={p}
              className={`cursor-pointer touch-manipulation rounded-md border px-2.5 py-2 text-xs font-medium transition focus-within:ring-2 focus-within:ring-violet-500/25 sm:py-1.5 ${chipClass(priority === p)}`}
            >
              <input
                type="radio"
                name={`${formId}-priority`}
                value={p}
                checked={priority === p}
                onChange={() => setPriority(p)}
                className="sr-only"
              />
              {PRIORITY_LABELS[p]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-3">
        <legend className="mb-1.5 text-xs font-medium text-zinc-500">Type</legend>
        <div className="flex flex-wrap gap-1.5">
          {TASK_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType((current) => (current === t ? null : t))}
              className={`touch-manipulation rounded-md border px-2.5 py-2 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-violet-500/25 sm:py-1.5 ${chipClass(type === t)}`}
              aria-pressed={type === t}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-3">
        <legend className="mb-1.5 text-xs font-medium text-zinc-500">Status</legend>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_LABEL_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              className={`touch-manipulation rounded-md border px-2.5 py-2 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-violet-500/25 sm:py-1.5 ${chipClass(statusLabels.includes(s))}`}
              aria-pressed={statusLabels.includes(s)}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          className="min-h-11 flex-1 touch-manipulation rounded-md bg-violet-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900 sm:min-h-0 sm:py-2"
        >
          {mode === 'create' ? 'Add task' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 touch-manipulation rounded-md px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 focus:ring-offset-zinc-900 sm:min-h-0 sm:py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
