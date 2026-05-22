import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useKanbanStore } from '../store/kanbanStore';
import { Column } from './Column';
import { NewColumnInput } from './NewColumnInput';

export function Board() {
  const columnOrder = useKanbanStore((s) => s.columnOrder);
  const columns = useKanbanStore((s) => s.columns);
  const moveTask = useKanbanStore((s) => s.moveTask);

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    moveTask(
      draggableId,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index,
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="board-scroll flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-3 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6">
          <div className="mx-auto flex h-full min-h-0 w-max max-w-[100rem] items-stretch gap-3 max-md:snap-x max-md:snap-mandatory sm:gap-4">
            {columnOrder.map((columnId) => {
              const column = columns[columnId];
              if (!column) return null;
              return <Column key={columnId} column={column} />;
            })}
            <NewColumnInput />
          </div>
        </div>
        {columnOrder.length > 1 && (
          <p
            className="pointer-events-none shrink-0 px-4 pb-2 text-center text-[11px] text-zinc-600 sm:hidden"
            aria-hidden
          >
            Swipe sideways to view more columns
          </p>
        )}
      </div>
    </DragDropContext>
  );
}
