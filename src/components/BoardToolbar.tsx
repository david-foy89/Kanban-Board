import { useEffect, useId, useRef, useState } from 'react';
import { boardSlice, useKanbanStore } from '../store/kanbanStore';
import {
  downloadBoardJson,
  downloadBoardMarkdown,
  getBoardStats,
  parseBoardImportFile,
} from '../utils/export';
import { ConfirmDialog } from './ConfirmDialog';
import { ShareBoardButton } from './ShareBoardButton';
import { DownloadIcon, MoreIcon, PrintIcon, SearchIcon, UploadIcon } from './icons';
import { useToast } from './Toast';

interface BoardToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function BoardToolbar({ searchQuery, onSearchChange }: BoardToolbarProps) {
  const store = useKanbanStore();
  const projectName = useKanbanStore((s) => s.projects[s.activeProjectId]?.name);
  const importBoard = useKanbanStore((s) => s.importBoard);
  const resetBoard = useKanbanStore((s) => s.resetBoard);
  const { showToast } = useToast();

  const searchId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const stats = getBoardStats(boardSlice(store));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleExportJson = () => {
    downloadBoardJson(boardSlice(store), projectName);
    showToast('Board downloaded as JSON');
    setMenuOpen(false);
  };

  const handleExportMarkdown = () => {
    downloadBoardMarkdown(boardSlice(store), projectName);
    showToast('Board downloaded as Markdown');
    setMenuOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const board = await parseBoardImportFile(file);
      importBoard(board);
      showToast('Board imported successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed';
      showToast(message, 'error');
    }
    setMenuOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setMenuOpen(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-lg border border-zinc-700/80 bg-zinc-900/80 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
            aria-label="Search tasks"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500 sm:inline">
            Ctrl+K
          </kbd>
        </div>

        <div className="hidden items-center gap-2 text-xs text-zinc-500 lg:flex">
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">
            {stats.taskCount} {stats.taskCount === 1 ? 'task' : 'tasks'}
          </span>
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">
            {stats.columnCount} columns
          </span>
        </div>

        <ShareBoardButton />

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 sm:text-sm"
          title="Print board (Ctrl+P)"
        >
          <PrintIcon />
          <span className="hidden sm:inline">Print</span>
        </button>

        <div className={`relative ${menuOpen ? 'z-50' : ''}`} ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 sm:text-sm"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <MoreIcon />
            <span className="hidden sm:inline">More</span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-52 rounded-lg border border-zinc-700/80 bg-zinc-900 py-1 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleExportJson}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800"
              >
                <DownloadIcon className="h-4 w-4 text-zinc-500" />
                Download JSON
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleExportMarkdown}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800"
              >
                <DownloadIcon className="h-4 w-4 text-zinc-500" />
                Download Markdown
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800"
              >
                <UploadIcon className="h-4 w-4 text-zinc-500" />
                Import JSON
              </button>
              <hr className="my-1 border-zinc-800" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmReset(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-rose-400 hover:bg-zinc-800"
              >
                Reset project
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={handleImport}
        />
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset this project?"
        message="This will remove all tasks and columns in the current project and restore the default board. This cannot be undone."
        confirmLabel="Reset project"
        variant="danger"
        onConfirm={() => {
          resetBoard();
          onSearchChange('');
          setConfirmReset(false);
          showToast('Project reset to defaults');
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  );
}
