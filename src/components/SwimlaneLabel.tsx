import { useEffect, useId, useRef, useState } from 'react';
import type { Swimlane } from '../types/kanban';
import { useKanbanStore } from '../store/kanbanStore';
import { ConfirmDialog } from './ConfirmDialog';

interface SwimlaneLabelProps {
  swimlane: Swimlane;
}

export function SwimlaneLabel({ swimlane }: SwimlaneLabelProps) {
  const renameSwimlane = useKanbanStore((s) => s.renameSwimlane);
  const deleteSwimlane = useKanbanStore((s) => s.deleteSwimlane);
  const swimlaneOrder = useKanbanStore((s) => s.swimlaneOrder ?? []);

  const renameInputId = useId();
  const renameRef = useRef<HTMLInputElement>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(swimlane.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isRenaming) renameRef.current?.focus();
  }, [isRenaming]);

  useEffect(() => {
    if (!isRenaming) setRenameValue(swimlane.title);
  }, [swimlane.title, isRenaming]);

  const laneAccent =
    swimlane.kind === 'fast-track'
      ? 'border-l-rose-500 bg-rose-500/5'
      : swimlane.kind === 'standard'
        ? 'border-l-sky-500 bg-sky-500/5'
        : 'border-l-zinc-600 bg-zinc-800/30';

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== swimlane.title) {
      renameSwimlane(swimlane.id, trimmed);
    }
    setIsRenaming(false);
  };

  return (
    <>
      <div
        className={`flex w-36 shrink-0 flex-col justify-center border-l-4 px-3 py-4 sm:w-40 print:border-l-2 print:bg-gray-50 ${laneAccent}`}
      >
        {isRenaming ? (
          <input
            ref={renameRef}
            id={renameInputId}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
            maxLength={40}
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs font-semibold text-zinc-100 outline-none focus:border-violet-500/60"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsRenaming(true)}
            className="text-left print:pointer-events-none"
            title="Click to rename swimlane"
          >
            <p className="text-xs font-semibold text-zinc-200 print:text-black">{swimlane.title}</p>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              {swimlane.kind === 'fast-track'
                ? 'Urgent lane'
                : swimlane.kind === 'standard'
                  ? 'Standard work'
                  : 'Swimlane'}
            </p>
          </button>
        )}

        {swimlaneOrder.length > 1 && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-2 text-left text-[10px] text-zinc-600 hover:text-rose-400 print:hidden"
          >
            Remove lane
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Remove "${swimlane.title}"?`}
        message="Tasks in this lane will move to another swimlane."
        confirmLabel="Remove lane"
        variant="danger"
        onConfirm={() => {
          deleteSwimlane(swimlane.id);
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
