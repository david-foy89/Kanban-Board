import type { Column } from '../types/kanban';
import { getColumnAccent } from '../utils/columnColors';
import { stageLabel } from '../utils/kanbanRules';
import { useKanbanStore } from '../store/kanbanStore';
import { WipBadge } from './WipBadge';

interface BoardColumnHeaderProps {
  column: Column;
  columnIndex: number;
}

export function BoardColumnHeader({ column, columnIndex }: BoardColumnHeaderProps) {
  const setColumnWipLimit = useKanbanStore((s) => s.setColumnWipLimit);
  const count = useKanbanStore(
    (s) => Object.values(s.tasks).filter((task) => task.columnId === column.id).length,
  );
  const accent = getColumnAccent(columnIndex);
  const stage = column.stage ?? 'custom';

  return (
    <div
      className={`flex w-72 shrink-0 flex-col rounded-t-xl border border-b-0 border-zinc-800/80 bg-zinc-900/70 px-3 py-3 print:border print:bg-gray-50`}
      aria-label={`${column.title} column`}
    >
      <div className={`mb-2 h-1 rounded-full ${accent.bar} print:hidden`} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-zinc-100 print:text-black">
            {column.title}
          </h2>
          <p className="text-[11px] text-zinc-500 print:text-gray-600">{stageLabel(stage)}</p>
        </div>
        <WipBadge
          count={count}
          limit={column.wipLimit ?? null}
          onSetLimit={(limit) => setColumnWipLimit(column.id, limit)}
        />
      </div>
    </div>
  );
}
