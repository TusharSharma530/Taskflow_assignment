import type { Column, Task } from '../types';
import { formatShortDate } from '../utils/dates';
import { PriorityBadge } from './PriorityBadge';
import { TaskCardMenu } from './TaskCardMenu';

interface TaskCardProps {
  task: Task;
  columns: Column[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (task: Task, columnId: number) => void;
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
        <span className="task-card-date">Created {formatShortDate(task.createdAt)}</span>
      </div>
    </article>
  );
}