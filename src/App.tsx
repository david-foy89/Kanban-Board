import { Board } from './components/Board';
import { BoardLoading } from './components/BoardLoading';
import { LocalStorageBadge } from './components/LocalStorageBadge';
import { useKanbanHydration } from './hooks/useKanbanHydration';

function App() {
  const hydrated = useKanbanHydration();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-5">
        <div className="mx-auto flex max-w-[100rem] items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight text-zinc-50 sm:text-lg">
              Kanban Board
            </h1>
            <p className="mt-0.5 hidden text-sm text-zinc-500 sm:block">
              Tasks and columns are stored in your browser (local storage).
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 sm:hidden">
              Saved on this device · swipe columns
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LocalStorageBadge />
            <a
              href="./docs/wireframes.html"
              className="rounded-md border border-zinc-700/80 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40 sm:text-sm"
            >
              Wireframes
            </a>
          </div>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {hydrated ? <Board /> : <BoardLoading />}
      </main>
    </div>
  );
}

export default App;
