import type { Column, Task } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { TaskCardMenu } from './TaskCardMenu';

interface TaskCardProps {
  task: Task;
  columns: Column[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (task: Task, columnId: number) => void;
}

function formatCreated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function TaskCard({ task, columns, onEdit, onDelete, onMove }: TaskCardProps) {
  return (
    <article className="task-card">
      <div className="task-card-top">
        <h4 className="task-card-title" title={task.title}>
          {task.title}
        </h4>
        <TaskCardMenu
          task={task}
          columns={columns}
          onEdit={() => onEdit(task)}
          onDelete={() => onDelete(task)}
          onMove={(columnId) => onMove(task, columnId)}
        />
      </div>

      {task.description ? <p className="task-card-description">{task.description}</p> : null}

      <div className="task-card-footer">
        <PriorityBadge priority={task.priority} />
        <span className="task-card-date">Created {formatCreated(task.createdAt)}</span>
      </div>
    </article>
  );
}