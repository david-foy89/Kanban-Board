import { Board } from './components/Board';

function App() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-5">
        <div className="mx-auto flex max-w-[100rem] items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight text-zinc-50 sm:text-lg">
              Kanban Board
            </h1>
            <p className="mt-0.5 hidden text-sm text-zinc-500 sm:block">
              Drag tasks between columns. Changes save automatically.
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 sm:hidden">
              Swipe columns · hold to drag tasks
            </p>
          </div>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Board />
      </main>
    </div>
  );
}

export default App;
