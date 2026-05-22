export function EmptyColumnState() {
  return (
    <div
      className="flex min-h-[6rem] shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700/60 bg-zinc-900/30 px-3 py-6 text-center transition-colors sm:min-h-[7rem] sm:px-4 sm:py-8"
      role="status"
      aria-label="No tasks in this column"
    >
      <svg
        className="mb-2 h-8 w-8 text-zinc-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p className="text-sm font-medium text-zinc-500">No tasks yet</p>
      <p className="mt-1 text-xs text-zinc-600">Add a task or drag one here</p>
    </div>
  );
}
