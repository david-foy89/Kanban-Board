import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import type { Column as ColumnType, Task } from '../types/kanban';
import { useKanbanStore } from '../store/kanbanStore';
import { encodeDroppableId } from '../utils/kanbanRules';
import { taskMatchesSearch } from '../utils/search';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { EmptyColumnState } from './EmptyColumnState';
import { cellShellClass } from '../utils/layout';

interface BoardCellProps {
  column: ColumnType;
  swimlaneId: string;
  searchQuery: string;
  allTasks: Record<string, Task>;
}

export function BoardCell({ column, swimlaneId, searchQuery, allTasks }: BoardCellProps) {
  const addTask = useKanbanStore((s) => s.addTask);
  const [showAddForm, setShowAddForm] = useState(false);
  const droppableId = encodeDroppableId(column.id, swimlaneId);
  const isBacklog = (column.stage ?? 'custom') === 'backlog';

  const cellTasks = column.taskIds
    .map((id) => allTasks[id])
    .filter(
      (task): task is NonNullable<typeof task> =>
        Boolean(task && task.swimlaneId === swimlaneId),
    );

  return (
    <div className={`${cellShellClass} print-cell`}>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex max-h-[min(24rem,calc(100dvh-14rem))] min-h-[7rem] flex-1 flex-col overflow-y-auto overflow-x-visible px-2 py-2 transition-colors [-webkit-overflow-scrolling:touch] print:min-h-0 print:max-h-none print:overflow-visible ${
              snapshot.isDraggingOver ? 'bg-violet-500/8 ring-1 ring-inset ring-violet-500/25' : ''
            } ${snapshot.isDraggingOver && column.wipLimit != null ? 'bg-amber-500/5' : ''}`}
          >
            {cellTasks.length === 0 && !snapshot.isDraggingOver && (
              <EmptyColumnState hasSearch={false} compact />
            )}

            {cellTasks.map((task, index) => {
              const matches = taskMatchesSearch(task, searchQuery);
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  searchQuery={searchQuery}
                  dimmed={!matches}
                />
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {isBacklog && (
        <footer className="shrink-0 border-t border-zinc-800/60 p-2 print:hidden">
          {showAddForm ? (
            <TaskForm
              mode="create"
              onSubmit={(title, description, labels) => {
                addTask(column.id, swimlaneId, title, description, labels);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex min-h-9 w-full items-center justify-center gap-1 rounded-md py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add task
            </button>
          )}
        </footer>
      )}
    </div>
  );
}
