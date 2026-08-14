import type { Column, Task } from '../types';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  column: Column;
  allColumns: Column[];
  count: number;
  onAddTask: (columnId: number) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => Promise<void>;
}

export function Column({
  column,
  allColumns,
  count,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: ColumnProps) {
  return (
    <section className="column" aria-label={column.title}>
      <header className="column-header">
        <h2 className="column-title">
          {column.title} <span className="column-count">({count})</span>
        </h2>
      </header>

      <div className="column-tasks">
        {column.tasks.length === 0 ? (
          <p className="column-empty">No tasks match.</p>
        ) : (
          column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columns={allColumns}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>

      <button
        type="button"
        className="button button-ghost button-add"
        onClick={() => onAddTask(column.id)}
      >
        + Add Task
      </button>
    </section>
  );
}