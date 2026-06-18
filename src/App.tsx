import { useState } from 'react';
import { Board } from './components/Board';
import { BoardToolbar } from './components/BoardToolbar';
import { CollabBanner } from './components/CollabBanner';
import { KanbanIcon } from './components/icons';
import { LocalStorageBadge } from './components/LocalStorageBadge';
import { ProjectSwitcher } from './components/ProjectSwitcher';
import { ToastProvider } from './components/Toast';
import { CollaborationProvider } from './collaboration/CollaborationProvider';
import { boardSlice, useKanbanStore } from './store/kanbanStore';
import { getBoardStats } from './utils/export';

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const store = useKanbanStore();
  const activeProject = useKanbanStore((s) => s.projects[s.activeProjectId]);
  const stats = getBoardStats(boardSlice(store));
  const printedAt = new Date().toLocaleString();
  const projectName = activeProject?.name ?? 'Kanban Board';

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-react-mounted>
      <header className="relative z-30 shrink-0 border-b border-zinc-800/60 bg-zinc-950/90 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5 print:hidden">
        <div className="mx-auto flex max-w-[100rem] flex-col gap-4">
          <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30">
                <KanbanIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <ProjectSwitcher />
                <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                  Share a live link to collaborate in real time
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LocalStorageBadge />
              <a
                href="./docs/wireframes.html"
                className="hidden rounded-lg border border-zinc-700/80 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40 sm:inline-flex sm:text-sm"
              >
                Wireframes
              </a>
            </div>
          </div>
          <BoardToolbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        </div>
      </header>

      <div className="hidden print:block print-header">
        <h1 className="text-2xl font-bold text-black">{projectName}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {stats.taskCount} tasks across {stats.columnCount} columns · Printed {printedAt}
        </p>
      </div>

      <main className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden">
        <CollabBanner />
        <Board searchQuery={searchQuery} />
      </main>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <CollaborationProvider>
        <AppContent />
      </CollaborationProvider>
    </ToastProvider>
  );
}

export default App;
