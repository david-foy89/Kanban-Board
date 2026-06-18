import { useEffect, useRef, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import type { Task } from '../types/kanban';
import { useKanbanStore } from '../store/kanbanStore';
import { normalizeTask } from '../utils/labels';
import { highlightText } from '../utils/search';
import { GripIcon } from './icons';
import { TaskForm } from './TaskForm';
import { TaskLabels } from './TaskLabels';

interface TaskCardProps {
  task: Task;
  index: number;
  searchQuery: string;
  dimmed?: boolean;
}

export function TaskCard({ task, index, searchQuery, dimmed = false }: TaskCardProps) {
  const updateTask = useKanbanStore((s) => s.updateTask);
  const deleteTask = useKanbanStore((s) => s.deleteTask);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  if (isEditing) {
    const labels = normalizeTask(task);
    return (
      <div className="mb-2 print:hidden">
        <TaskForm
          mode="edit"
          initialTitle={task.title}
          initialDescription={task.description}
          initialLabels={{
            priority: labels.priority,
            type: labels.type,
            statusLabels: labels.statusLabels,
          }}
          onSubmit={(title, description, taskLabels) => {
            updateTask(task.id, {
              title,
              description,
              priority: taskLabels.priority,
              type: taskLabels.type,
              statusLabels: taskLabels.statusLabels,
            });
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={dimmed}>
      {(provided, snapshot) => (
        <article
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative mb-2 touch-manipulation rounded-lg border bg-zinc-900/90 p-3.5 shadow-sm transition-[box-shadow,transform,border-color,opacity] sm:p-3 print-task-card ${
            menuOpen ? 'z-50' : ''
          } ${dimmed ? 'opacity-35 print:opacity-100' : ''} ${
            snapshot.isDragging
              ? 'border-violet-500/40 shadow-lg shadow-violet-500/10 ring-2 ring-violet-500/20'
              : 'border-zinc-800 hover:border-zinc-700'
          }`}
          style={provided.draggableProps.style}
          data-dimmed={dimmed || undefined}
        >
          <div className="flex items-start gap-2">
            <button
              type="button"
              {...provided.dragHandleProps}
              className="mt-0.5 shrink-0 rounded p-1 text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 print:hidden"
              aria-label={`Drag ${task.title}`}
              tabIndex={dimmed ? -1 : 0}
            >
              <GripIcon className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <TaskLabels task={task} />
                </div>

                <div className="relative shrink-0 print:hidden" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    className="rounded-md p-2 text-zinc-500 opacity-100 transition hover:bg-zinc-800 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500/40 sm:p-1 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                    aria-label="Task actions"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 4a2 2 0 110-4 2 2 0 010 4zm0 4a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 z-50 mt-1 min-w-[8.5rem] rounded-md border border-zinc-700 bg-zinc-900 py-1 shadow-xl"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          setIsEditing(true);
                        }}
                        className="w-full px-3 py-3 text-left text-sm text-zinc-300 transition hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none sm:py-1.5"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          deleteTask(task.id, task.columnId);
                        }}
                        className="w-full px-3 py-3 text-left text-sm text-rose-400 transition hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none sm:py-1.5"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="mt-2 break-words text-sm font-medium leading-snug text-zinc-100 print:text-black">
                {highlightText(task.title, searchQuery)}
              </h3>

              {task.description && (
                <p className="mt-1.5 break-words text-xs leading-relaxed text-zinc-500 line-clamp-4 print:line-clamp-none print:text-gray-700">
                  {highlightText(task.description, searchQuery)}
                </p>
              )}
            </div>
          </div>
        </article>
      )}
    </Draggable>
  );
}
