import { useEffect, useId, useRef, useState } from 'react';
import type { Priority } from '../types/kanban';
import { PRIORITY_LABELS } from '../utils/priority';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

interface TaskFormProps {
  mode: 'create' | 'edit';
  initialTitle?: string;
  initialDescription?: string;
  initialPriority?: Priority;
  onSubmit: (title: string, description: string, priority: Priority) => void;
  onCancel: () => void;
}

export function TaskForm({
  mode,
  initialTitle = '',
  initialDescription = '',
  initialPriority = 'medium',
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [priority, setPriority] = useState<Priority>(initialPriority);
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Title is required');
      return;
    }
    setTitleError(null);
    onSubmit(trimmed, description, priority);
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
        <div className="flex flex-col gap-2 min-[400px]:flex-row">
          {PRIORITIES.map((p) => (
            <label
              key={p}
              className={`flex-1 cursor-pointer touch-manipulation rounded-md border px-2 py-3 text-center text-xs font-medium transition focus-within:ring-2 focus-within:ring-violet-500/25 sm:py-1.5 ${
                priority === p
                  ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
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
