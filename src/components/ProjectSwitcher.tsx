import { useEffect, useId, useRef, useState } from 'react';
import { useKanbanStore } from '../store/kanbanStore';
import { getBoardStats } from '../utils/export';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';

export function ProjectSwitcher() {
  const activeProjectId = useKanbanStore((s) => s.activeProjectId);
  const projectOrder = useKanbanStore((s) => s.projectOrder ?? []);
  const projects = useKanbanStore((s) => s.projects);
  const createProject = useKanbanStore((s) => s.createProject);
  const switchProject = useKanbanStore((s) => s.switchProject);
  const renameProject = useKanbanStore((s) => s.renameProject);
  const deleteProject = useKanbanStore((s) => s.deleteProject);

  const current = useKanbanStore((s) => s.projects[s.activeProjectId]);
  const { showToast } = useToast();

  const menuRef = useRef<HTMLDivElement>(null);
  const newProjectInputId = useId();
  const renameInputId = useId();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setShowNewForm(false);
        setRenamingId(null);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setShowNewForm(false);
        setRenamingId(null);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newProjectName.trim();
    if (!trimmed) return;

    createProject(trimmed);
    setNewProjectName('');
    setShowNewForm(false);
    setMenuOpen(false);
    showToast(`Created "${trimmed}"`);
  };

  const commitRename = (projectId: string) => {
    const trimmed = renameValue.trim();
    if (trimmed) {
      renameProject(projectId, trimmed);
      showToast('Project renamed');
    }
    setRenamingId(null);
  };

  return (
    <>
      <div className={`relative min-w-0 ${menuOpen ? 'z-50' : ''}`} ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex max-w-full items-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-3 py-2 text-left transition hover:border-zinc-600 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          aria-expanded={menuOpen}
          aria-haspopup="listbox"
        >
          <span className="min-w-0 truncate text-sm font-semibold text-zinc-100 sm:text-base">
            {current?.name ?? 'Project'}
          </span>
          <svg
            className={`h-4 w-4 shrink-0 text-zinc-500 transition ${menuOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {menuOpen && (
          <div
            role="listbox"
            aria-label="Projects"
            className="absolute left-0 z-50 mt-2 w-[min(calc(100vw-2rem),18rem)] rounded-xl border border-zinc-700/80 bg-zinc-900 py-1 shadow-2xl sm:w-72"
          >
            <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Your projects
            </p>

            {projectOrder.map((projectId) => {
              const project = projects[projectId];
              if (!project) return null;

              const stats = getBoardStats(project);
              const isActive = projectId === activeProjectId;
              const isRenaming = renamingId === projectId;

              return (
                <div
                  key={projectId}
                  role="option"
                  aria-selected={isActive}
                  className={`group mx-1 flex items-center gap-1 rounded-lg px-2 py-1 ${
                    isActive ? 'bg-violet-500/10' : 'hover:bg-zinc-800/80'
                  }`}
                >
                  {isRenaming ? (
                    <input
                      id={renameInputId}
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => commitRename(projectId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename(projectId);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      maxLength={60}
                      className="min-w-0 flex-1 rounded border border-zinc-600 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-violet-500/60"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        switchProject(projectId);
                        setMenuOpen(false);
                      }}
                      className="min-w-0 flex-1 px-1 py-2 text-left"
                    >
                      <span
                        className={`block truncate text-sm font-medium ${
                          isActive ? 'text-violet-300' : 'text-zinc-200'
                        }`}
                      >
                        {project.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {stats.taskCount} {stats.taskCount === 1 ? 'task' : 'tasks'}
                      </span>
                    </button>
                  )}

                  {!isRenaming && (
                    <div className="flex shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingId(projectId);
                          setRenameValue(project.name);
                        }}
                        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                        aria-label={`Rename ${project.name}`}
                        title="Rename"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      {projectOrder.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ id: projectId, name: project.name })
                          }
                          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-rose-400"
                          aria-label={`Delete ${project.name}`}
                          title="Delete"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <hr className="my-1 border-zinc-800" />

            {showNewForm ? (
              <form onSubmit={handleCreateProject} className="px-3 py-2">
                <label htmlFor={newProjectInputId} className="sr-only">
                  New project name
                </label>
                <input
                  id={newProjectInputId}
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  maxLength={60}
                  autoFocus
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewForm(false);
                      setNewProjectName('');
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewForm(true)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-violet-400 hover:bg-zinc-800"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                New project
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This project and all its tasks will be permanently removed."
        confirmLabel="Delete project"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) {
            deleteProject(deleteTarget.id);
            showToast(`Deleted "${deleteTarget.name}"`);
          }
          setDeleteTarget(null);
          setMenuOpen(false);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
