/** Shared column width + height for horizontal board scroll on mobile/desktop */
export const columnShellClass =
  'flex max-h-[calc(100dvh-10rem)] w-[min(calc(100vw-1.5rem),18rem)] shrink-0 flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/50 shadow-sm shadow-black/10 backdrop-blur-sm max-md:snap-center sm:max-h-[calc(100dvh-12rem)] sm:w-72';

export const cellShellClass =
  'relative flex w-72 shrink-0 flex-col overflow-visible rounded-b-xl border border-t-0 border-zinc-800/80 bg-zinc-900/40 shadow-sm print:border print:bg-white';

export const columnAddShellClass =
  'flex max-h-[calc(100dvh-10rem)] w-[min(calc(100vw-1.5rem),18rem)] shrink-0 flex-col max-md:snap-center sm:max-h-[calc(100dvh-12rem)] sm:w-72';
