import { useState } from 'react';
import type { Column, Priority, Task, TaskInput, TaskUpdate } from '../types';
import { isPriority } from '../types';

interface TaskFormFieldsProps {
  mode: 'create' | 'edit';
  columns?: Column[];
  task?: Task;
  defaultColumnId?: number;
  initialPriority?: Priority;
  onCancel: () => void;
  onSubmit: (input: TaskInput | TaskUpdate) => Promise<void>;
}

export function TaskFormFields({
  mode,
  columns = [],
  task,
  defaultColumnId,
  initialPriority,
  onCancel,
  onSubmit,
}: TaskFormFieldsProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(
    task?.priority ?? initialPriority ?? 'MEDIUM',
  );
  const [columnId, setColumnId] = useState<number>(defaultColumnId ?? task?.columnId ?? 0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setValidationError('Title is required.');
      return;
    }
    setValidationError(null);

    if (mode === 'create') {
      if (!columns.some((column) => column.id === columnId)) {
        setValidationError('Please choose a column.');
        return;
      }
    }

    const input: TaskInput | TaskUpdate =
      mode === 'create'
        ? {
            columnId,
            title: trimmed,
            description: description.trim() || null,
            priority,
          }
        : {
            title: trimmed,
            description: description.trim() || null,
            priority,
          };

    setApiError(null);
    setSaving(true);
    onSubmit(input)
      .catch((err: unknown) => {
        setApiError(err instanceof Error ? err.message : 'Unable to save changes. Please try again.');
      })
      .finally(() => setSaving(false));
  }

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label className="form-label" htmlFor="task-title">
          Title <span className="required-mark">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to be done?"
          autoFocus
        />
        {validationError ? <p className="form-error">{validationError}</p> : null}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="task-description">
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional details"
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="task-priority">
            Priority
          </label>
          <select
            id="task-priority"
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
        </div>

        {mode === 'create' ? (
          <div className="form-field">
            <label className="form-label" htmlFor="task-column">
              Column
            </label>
            <select
              id="task-column"
              value={columnId}
              onChange={(event) => setColumnId(Number(event.target.value))}
            >
              <option value={0} disabled>
                Choose a column
              </option>
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.title}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {apiError ? <p className="form-error">{apiError}</p> : null}

      <div className="modal-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button type="submit" className="button button-primary" disabled={saving}>
          {saving ? 'Saving...' : mode === 'create' ? 'Create task' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}