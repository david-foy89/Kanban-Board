import { useId, useRef, useState } from 'react';
import { useKanbanStore } from '../store/kanbanStore';

interface NewColumnInputProps {
  compact?: boolean;
}

export function NewColumnInput({ compact = false }: NewColumnInputProps) {
  const addColumn = useKanbanStore((s) => s.addColumn);
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Column title is required');
      return;
    }
    addColumn(trimmed);
    setTitle('');
    setError(null);
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className={`flex touch-manipulation items-center justify-center rounded-xl border border-dashed border-zinc-700/80 bg-zinc-900/20 text-sm font-medium text-zinc-500 transition hover:border-zinc-600 hover:bg-zinc-900/50 hover:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
          compact ? 'min-h-[4.5rem] w-full px-3 py-2 text-xs' : 'min-h-[12rem] w-72 px-4'
        }`}
      >
        <svg className={`${compact ? 'mr-1.5 h-4 w-4' : 'mb-2 h-5 w-5'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        Add column
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-3 ${compact ? 'w-full' : 'w-72'}`}
      aria-labelledby={`${formId}-label`}
    >
      <label id={`${formId}-label`} htmlFor={`${formId}-input`} className="text-sm font-medium text-zinc-300">
        New column
      </label>
      <input
        ref={inputRef}
        id={`${formId}-input`}
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (error) setError(null);
        }}
        placeholder="Column title"
        maxLength={40}
        className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/25"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${formId}-error` : undefined}
      />
      {error && (
        <p id={`${formId}-error`} className="mt-1 text-xs text-rose-400" role="alert">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-md bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setTitle('');
            setError(null);
          }}
          className="rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
