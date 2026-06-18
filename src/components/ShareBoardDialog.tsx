import { useEffect, useId, useState } from 'react';
import type { ShareScope, ShareScopeMode } from '../collaboration/types';
import { useKanbanStore } from '../store/kanbanStore';
import { describeShareScope } from '../collaboration/shareScope';

interface ShareBoardDialogProps {
  open: boolean;
  initialScope: ShareScope;
  onClose: () => void;
  onConfirm: (scope: ShareScope) => void;
}

export function ShareBoardDialog({
  open,
  initialScope,
  onClose,
  onConfirm,
}: ShareBoardDialogProps) {
  const titleId = useId();
  const projectOrder = useKanbanStore((s) => s.projectOrder ?? []);
  const projects = useKanbanStore((s) => s.projects);
  const activeProjectId = useKanbanStore((s) => s.activeProjectId);
  const activeName = projects[activeProjectId]?.name ?? 'Current board';

  const [mode, setMode] = useState<ShareScopeMode>(initialScope.mode);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    initialScope.mode === 'selected'
      ? initialScope.projectIds
      : projectOrder.filter((id) => projects[id]),
  );

  useEffect(() => {
    if (!open) return;
    setMode(initialScope.mode);
    setSelectedIds(
      initialScope.mode === 'selected'
        ? initialScope.projectIds.filter((id) => projects[id])
        : projectOrder.filter((id) => projects[id]),
    );
  }, [open, initialScope, projectOrder, projects]);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const buildScope = (): ShareScope | null => {
    if (mode === 'all') {
      return {
        mode: 'all',
        projectIds: projectOrder.filter((id) => projects[id]),
      };
    }

    if (mode === 'current') {
      return { mode: 'current', projectIds: [activeProjectId] };
    }

    const ids = selectedIds.filter((id) => projects[id]);
    if (ids.length === 0) return null;
    return { mode: 'selected', projectIds: ids };
  };

  const previewScope = buildScope();
  const preview = previewScope
    ? describeShareScope(useKanbanStore.getState(), previewScope)
    : 'Select at least one board';

  const toggleProject = (projectId: string) => {
    setSelectedIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  };

  const handleConfirm = () => {
    const scope = buildScope();
    if (!scope) return;
    onConfirm(scope);
  };

  const allCount = projectOrder.filter((id) => projects[id]).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center print:hidden"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(90vh,640px)] w-full max-w-md flex-col rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-2xl"
      >
        <div className="border-b border-zinc-800 px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-zinc-50">
            Share live link
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Choose which boards collaborators can view and edit.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <fieldset className="space-y-3">
            <legend className="sr-only">Share scope</legend>

            <label className="flex cursor-pointer gap-3 rounded-lg border border-zinc-700/80 bg-zinc-900/60 p-3 transition has-checked:border-violet-500/50 has-checked:bg-violet-500/10">
              <input
                type="radio"
                name="share-scope"
                checked={mode === 'all'}
                onChange={() => setMode('all')}
                className="mt-0.5 accent-violet-500"
              />
              <span>
                <span className="block text-sm font-medium text-zinc-100">All boards</span>
                <span className="block text-xs text-zinc-500">
                  Share every project ({allCount} {allCount === 1 ? 'board' : 'boards'})
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer gap-3 rounded-lg border border-zinc-700/80 bg-zinc-900/60 p-3 transition has-checked:border-violet-500/50 has-checked:bg-violet-500/10">
              <input
                type="radio"
                name="share-scope"
                checked={mode === 'current'}
                onChange={() => setMode('current')}
                className="mt-0.5 accent-violet-500"
              />
              <span>
                <span className="block text-sm font-medium text-zinc-100">Current board only</span>
                <span className="block text-xs text-zinc-500">{activeName}</span>
              </span>
            </label>

            <label className="flex cursor-pointer gap-3 rounded-lg border border-zinc-700/80 bg-zinc-900/60 p-3 transition has-checked:border-violet-500/50 has-checked:bg-violet-500/10">
              <input
                type="radio"
                name="share-scope"
                checked={mode === 'selected'}
                onChange={() => setMode('selected')}
                className="mt-0.5 accent-violet-500"
              />
              <span>
                <span className="block text-sm font-medium text-zinc-100">Choose boards</span>
                <span className="block text-xs text-zinc-500">Pick one or more projects</span>
              </span>
            </label>
          </fieldset>

          {mode === 'selected' && (
            <div className="mt-4 space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
              {projectOrder.map((projectId) => {
                const project = projects[projectId];
                if (!project) return null;
                const checked = selectedIds.includes(projectId);
                return (
                  <label
                    key={projectId}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-800/80"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProject(projectId)}
                      className="accent-violet-500"
                    />
                    <span className="text-sm text-zinc-200">{project.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-800 px-5 py-4">
          <p className="mb-3 text-xs text-zinc-500">
            Link will share: <span className="text-violet-300">{preview}</span>
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!previewScope}
              className="min-h-10 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy share link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
