import type { Column, Task } from '../types';
import { statusTone } from '../utils/taskStatus';
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
  filtersActive?: boolean;
}

export function BoardColumn({
  column,
  allColumns,
  onAdd,
  onEdit,
  onDelete,
  onMove,
  showCount = true,
  filtersActive = false,
}: BoardColumnProps) {
  const tone = statusTone(column.title);

  return (
    <section className={`column column-tone-${tone}`} aria-label={column.title}>
      <header className="column-header">
        <div className="column-title-wrap">
          <h3 className="column-title">{column.title}</h3>
          {showCount ? (
            <span className="column-count" aria-label={`${column.tasks.length} tasks`}>
              {column.tasks.length}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="icon-button column-add-button"
          onClick={() => onAdd(column.id)}
          aria-label={`Add task to ${column.title}`}
        >
          <PlusIcon width={16} height={16} />
        </button>
      </header>

      <div className="column-tasks">
        {column.tasks.length === 0 ? (
          <div className="column-empty">
            <p className="column-empty-title">{filtersActive ? 'No matching tasks' : 'No tasks here'}</p>
            <p className="column-empty-message">
              {filtersActive ? 'Adjust your search or filters.' : 'Add a task to get started.'}
            </p>
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