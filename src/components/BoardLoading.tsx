export function BoardLoading() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-500"
        aria-hidden
      />
      <p className="text-sm text-zinc-500">Loading your board…</p>
    </div>
  );
}
