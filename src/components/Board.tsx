import { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useKanbanStore } from '../store/kanbanStore';
import { BoardCell } from './BoardCell';
import { BoardColumnHeader } from './BoardColumnHeader';
import { NewColumnInput } from './NewColumnInput';
import { SwimlaneLabel } from './SwimlaneLabel';
import { useToast } from './Toast';

interface BoardProps {
  searchQuery: string;
}

export function Board({ searchQuery }: BoardProps) {
  const columnOrder = useKanbanStore((s) => s.columnOrder ?? []);
  const columns = useKanbanStore((s) => s.columns);
  const tasks = useKanbanStore((s) => s.tasks);
  const swimlaneOrder = useKanbanStore((s) => s.swimlaneOrder ?? []);
  const swimlanes = useKanbanStore((s) => s.swimlanes ?? {});
  const moveTask = useKanbanStore((s) => s.moveTask);
  const addSwimlane = useKanbanStore((s) => s.addSwimlane);
  const { showToast } = useToast();

  const [newLaneName, setNewLaneName] = useState('');
  const [showNewLane, setShowNewLane] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const error = moveTask(
      draggableId,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index,
    );

    if (error) {
      showToast(error, 'error');
    }
  };

  const handleAddSwimlane = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLaneName.trim();
    if (!trimmed) return;
    addSwimlane(trimmed);
    setNewLaneName('');
    setShowNewLane(false);
    showToast(`Added swimlane "${trimmed}"`);
  };

  const hasActiveSearch = searchQuery.trim().length > 0;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="board-scroll flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-zinc-800/40 bg-zinc-950/50 px-4 py-2 text-xs text-zinc-500 print:hidden sm:px-6">
          <strong className="font-medium text-zinc-400">Pull system:</strong> pull tasks from{' '}
          <span className="text-violet-400">Ready</span> into In Progress when you have capacity.
          WIP limits block overloading active columns.
        </div>

        {hasActiveSearch && (
          <p className="shrink-0 px-4 pt-3 text-center text-xs text-zinc-500 sm:px-6 print:hidden">
            Showing tasks matching &ldquo;{searchQuery.trim()}&rdquo;
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-auto px-3 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6 print:overflow-visible print:px-0 print:py-0">
          <div className="mx-auto w-max min-w-full">
            <div className="flex w-max min-w-full gap-3 sm:gap-4">
              <div className="w-36 shrink-0 sm:w-40 print:hidden" aria-hidden />

              {columnOrder.map((columnId, index) => {
                const column = columns[columnId];
                if (!column) return null;
                return (
                  <BoardColumnHeader key={columnId} column={column} columnIndex={index} />
                );
              })}

              <div className="w-48 shrink-0 print:hidden">
                <NewColumnInput compact />
              </div>
            </div>

            {swimlaneOrder.map((swimlaneId) => {
              const swimlane = swimlanes[swimlaneId];
              if (!swimlane) return null;

              return (
                <div key={swimlaneId} className="mt-3 flex w-max min-w-full gap-3 sm:gap-4">
                  <SwimlaneLabel swimlane={swimlane} />

                  {columnOrder.map((columnId) => {
                    const column = columns[columnId];
                    if (!column) return null;
                    return (
                      <BoardCell
                        key={`${columnId}-${swimlaneId}`}
                        column={column}
                        swimlaneId={swimlaneId}
                        searchQuery={searchQuery}
                        allTasks={tasks}
                      />
                    );
                  })}

                  <div className="w-48 shrink-0 print:hidden" aria-hidden />
                </div>
              );
            })}

            <div className="mt-4 print:hidden">
              {showNewLane ? (
                <form onSubmit={handleAddSwimlane} className="flex max-w-sm gap-2">
                  <input
                    type="text"
                    value={newLaneName}
                    onChange={(e) => setNewLaneName(e.target.value)}
                    placeholder="Swimlane name"
                    maxLength={40}
                    autoFocus
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/60"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewLane(false);
                      setNewLaneName('');
                    }}
                    className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewLane(true)}
                  className="rounded-lg border border-dashed border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-500 transition hover:border-zinc-600 hover:text-zinc-300"
                >
                  + Add swimlane
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}
