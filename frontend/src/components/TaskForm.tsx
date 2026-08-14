import { useState } from 'react';
import type { Column, Priority, Task, TaskInput, TaskUpdate } from '../types';
import { isPriority } from '../api';

interface TaskFormProps {
  columns: Column[];
  mode: 'create' | 'edit';
  defaultColumnId?: number;
  task?: Task;
  onSubmit: (input: TaskInput | TaskUpdate) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({
  columns,
  mode,
  defaultColumnId,
  task,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'MEDIUM');
  const [columnId, setColumnId] = useState<number>(defaultColumnId ?? task?.columnId ?? 0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Title is required.');
      return;
    }
    if (mode === 'create' && !columnId) {
      setValidationError('Please choose a column.');
      return;
    }

    setValidationError(null);
    setApiError(null);
    setSaving(true);

    const input: TaskInput | TaskUpdate =
      mode === 'create'
        ? { columnId, title: trimmedTitle, description: description.trim(), priority }
        : {
            title: trimmedTitle,
            description: description.trim(),
            priority,
          };

    onSubmit(input).catch((err: unknown) => {
      setApiError(err instanceof Error ? err.message : 'Unable to save the task. Please try again.');
    });
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label className="form-field">
        <span className="form-label">Title *</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to be done?"
          autoFocus
        />
      </label>

      <label className="form-field">
        <span className="form-label">Description</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional details"
          rows={3}
        />
      </label>

      <label className="form-field">
        <span className="form-label">Priority</span>
        <select
          value={priority}
          onChange={(event) => {
            if (isPriority(event.target.value)) {
              setPriority(event.target.value);
            }
          }}
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </label>

      {mode === 'create' ? (
        <label className="form-field">
          <span className="form-label">Column</span>
          <select value={columnId} onChange={(event) => setColumnId(Number(event.target.value))}>
            <option value={0} disabled>
              Choose a column
            </option>
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {validationError ? <p className="inline-error">{validationError}</p> : null}
      {apiError ? <p className="inline-error">{apiError}</p> : null}

      <div className="form-actions">
        <button type="button" className="button button-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="button button-primary" disabled={saving}>
          {saving ? 'Saving...' : mode === 'create' ? 'Add Task' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}