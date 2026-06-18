import { useId, useState } from 'react';

interface WipBadgeProps {
  count: number;
  limit: number | null;
  onSetLimit: (limit: number | null) => void;
}

export function WipBadge({ count, limit, onSetLimit }: WipBadgeProps) {
  const inputId = useId();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(limit?.toString() ?? '');

  const atLimit = limit != null && count >= limit;
  const overLimit = limit != null && count > limit;

  const commit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      onSetLimit(null);
    } else {
      const parsed = Number.parseInt(trimmed, 10);
      onSetLimit(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="print:hidden">
        <label htmlFor={inputId} className="sr-only">
          WIP limit
        </label>
        <input
          id={inputId}
          type="number"
          min={1}
          max={99}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-12 rounded border border-zinc-600 bg-zinc-950 px-1.5 py-0.5 text-center text-xs text-zinc-100 outline-none focus:border-violet-500/60"
          autoFocus
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(limit?.toString() ?? '');
        setEditing(true);
      }}
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset transition print:hidden ${
        overLimit
          ? 'bg-rose-500/20 text-rose-300 ring-rose-500/30'
          : atLimit
            ? 'bg-amber-500/20 text-amber-300 ring-amber-500/30'
            : limit != null
              ? 'bg-zinc-800 text-zinc-400 ring-zinc-700 hover:bg-zinc-700'
              : 'bg-zinc-800/50 text-zinc-600 ring-zinc-800 hover:bg-zinc-800 hover:text-zinc-400'
      }`}
      title={limit != null ? 'Click to edit WIP limit' : 'Click to set WIP limit'}
    >
      {limit != null ? `${count}/${limit}` : count}
    </button>
  );
}
