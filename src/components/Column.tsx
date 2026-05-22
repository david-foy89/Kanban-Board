import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import type { Column as ColumnType } from '../types/kanban';
import { useKanbanStore } from '../store/kanbanStore';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { EmptyColumnState } from './EmptyColumnState';
import { columnShellClass } from '../utils/layout';

interface ColumnProps {
  column: ColumnType;
}

export function Column({ column }: ColumnProps) {
  const tasks = useKanbanStore((s) => s.tasks);
  const addTask = useKanbanStore((s) => s.addTask);
  const deleteColumn = useKanbanStore((s) => s.deleteColumn);
  const columnOrder = useKanbanStore((s) => s.columnOrder);
  const [showAddForm, setShowAddForm] = useState(false);

  const columnTasks = column.taskIds
    .map((id) => tasks[id])
    .filter((task): task is NonNullable<typeof task> => Boolean(task));

  const canDeleteColumn = columnOrder.length > 1;

  return (
    <section
      className={columnShellClass}
      aria-label={`${column.title} column`}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800/60 px-3 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-zinc-100">{column.title}</h2>
          <p className="text-xs text-zinc-500">
            {columnTasks.length} {columnTasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>

        {canDeleteColumn && (
          <button
            type="button"
            onClick={() => deleteColumn(column.id)}
            className="rounded-md p-2.5 text-zinc-600 transition hover:bg-zinc-800 hover:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 sm:p-1.5"
            aria-label={`Delete ${column.title} column`}
            title="Delete column"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </header>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-2 py-2 transition-colors [-webkit-overflow-scrolling:touch] ${
              snapshot.isDraggingOver ? 'bg-violet-500/5' : ''
            }`}
          >
            {columnTasks.length === 0 && !snapshot.isDraggingOver && <EmptyColumnState />}

            {columnTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <footer className="shrink-0 border-t border-zinc-800/60 p-2">
        {showAddForm ? (
          <TaskForm
            mode="create"
            onSubmit={(title, description, priority) => {
              addTask(column.id, title, description, priority);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex min-h-11 w-full touch-manipulation items-center justify-center gap-1.5 rounded-md py-3 text-sm font-medium text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 sm:min-h-0 sm:py-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
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
    </section>
  );
}
