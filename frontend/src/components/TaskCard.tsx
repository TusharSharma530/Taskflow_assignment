import { useState } from 'react';
import type { Column, Task } from '../types';
import { moveTask } from '../api';
import { PriorityBadge } from './PriorityBadge';

interface TaskCardProps {
  task: Task;
  columns: Column[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => Promise<void>;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function TaskCard({ task, columns, onEdit, onDelete }: TaskCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moveOptions = columns.filter((column) => column.id !== task.columnId);

  async function handleMove(columnId: number): Promise<void> {
    if (columnId === task.columnId) {
      return;
    }
    setMoving(true);
    setError(null);
    try {
      await moveTask(task.id, columnId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to move the task.');
    } finally {
      setMoving(false);
    }
  }

  async function confirmDelete(): Promise<void> {
    setDeleting(true);
    setError(null);
    try {
      await onDelete(task);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete the task.');
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <article className="task-card">
      <div className="task-card-header">
        <h3 className="task-title">{task.title}</h3>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description ? (
        <p className="task-description">{task.description}</p>
      ) : null}

      <p className="task-date">Created {formatDate(task.createdAt)}</p>

      <div className="task-card-actions">
        {confirmingDelete ? (
          <div className="task-confirm">
            <span>Delete this task?</span>
            <button
              type="button"
              className="button button-danger button-small"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              type="button"
              className="button button-ghost button-small"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="button button-ghost button-small"
              onClick={() => onEdit(task)}
            >
              Edit
            </button>
            <button
              type="button"
              className="button button-ghost button-danger button-small"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </button>
          </>
        )}
      </div>

      <div className="task-card-move">
        {moveOptions.length > 0 ? (
          <>
            <label htmlFor={`move-${task.id}`}>Move to:</label>
            <select
              id={`move-${task.id}`}
              value=""
              onChange={(event) => handleMove(Number(event.target.value))}
              disabled={moving}
            >
              <option value="" disabled>
                {moving ? 'Moving...' : 'Select column'}
              </option>
              {moveOptions.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.title}
                </option>
              ))}
            </select>
          </>
        ) : (
          <span className="task-move-empty">Only column available</span>
        )}
      </div>

      {error ? <p className="inline-error">{error}</p> : null}
    </article>
  );
}