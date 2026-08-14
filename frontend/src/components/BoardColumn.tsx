import type { Column, Task } from '../types';
import { PlusIcon } from './icons';
import { TaskCard } from './TaskCard';

interface BoardColumnProps {
  column: Column;
  allColumns: Column[];
  onAdd: (columnId: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (task: Task, columnId: number) => void;
  showCount?: boolean;
}

export function BoardColumn({
  column,
  allColumns,
  onAdd,
  onEdit,
  onDelete,
  onMove,
  showCount = true,
}: BoardColumnProps) {
  return (
    <section className="column" aria-label={column.title}>
      <header className="column-header">
        <h3 className="column-title">{column.title}</h3>
        <div className="column-header-actions">
          {showCount ? (
            <span className="column-count" aria-label={`${column.tasks.length} tasks`}>
              {column.tasks.length}
            </span>
          ) : null}
          <button
            type="button"
            className="icon-button column-add-button"
            onClick={() => onAdd(column.id)}
            aria-label={`Add task to ${column.title}`}
          >
            <PlusIcon width={16} height={16} />
          </button>
        </div>
      </header>

      <div className="column-tasks">
        {column.tasks.length === 0 ? (
          <div className="column-empty">
            <p className="column-empty-title">No tasks yet</p>
            <p className="column-empty-message">Add a task to get started.</p>
          </div>
        ) : (
          column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columns={allColumns}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))
        )}
      </div>

      <button type="button" className="button button-ghost column-add-link" onClick={() => onAdd(column.id)}>
        <PlusIcon width={15} height={15} />
        Add task
      </button>
    </section>
  );
}