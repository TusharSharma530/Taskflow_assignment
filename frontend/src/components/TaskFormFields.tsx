import { useEffect, useState } from 'react';
import type { Column, Priority, Task, TaskInput } from '../types';
import { isPriority } from '../types';

interface TaskFormFieldsProps {
  mode: 'create' | 'edit';
  columns: Column[];
  task?: Task;
  defaultColumnId?: number;
  initialPriority?: Priority;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
  onCancel: () => void;
  onSubmit: (input: TaskInput) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
}

export function TaskFormFields({
  mode,
  columns = [],
  task,
  defaultColumnId,
  initialPriority,
  titlePlaceholder = 'e.g. Build authentication API',
  descriptionPlaceholder = 'Add more details about this task...',
  onCancel,
  onSubmit,
  onDirtyChange,
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

  const dirty =
    mode === 'edit' && task
      ? title !== task.title ||
        description !== (task.description ?? '') ||
        priority !== task.priority ||
        columnId !== task.columnId
      : false;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    if (title.trim().length === 0) {
      setValidationError(title.length === 0 ? 'Title is required.' : 'Title cannot be empty.');
      return;
    }
    if (!columns.some((column) => column.id === columnId)) {
      setValidationError('Please choose a column.');
      return;
    }
    setValidationError(null);

    const input: TaskInput = {
      columnId,
      title: title.trim(),
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
          placeholder={titlePlaceholder}
          aria-invalid={validationError ? true : undefined}
          aria-describedby={validationError ? 'task-title-error' : undefined}
          autoFocus
        />
        {validationError ? (
          <p id="task-title-error" className="form-error" role="alert">
            {validationError}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="task-description">
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={descriptionPlaceholder}
          rows={4}
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

        <div className="form-field">
          <label className="form-label" htmlFor="task-column">
            {mode === 'edit' ? 'Current column' : 'Column'}
          </label>
          <select
            id="task-column"
            value={columnId}
            onChange={(event) => setColumnId(Number(event.target.value))}
          >
            {columns.length === 0 ? (
              <option value={0} disabled>
                No columns available
              </option>
            ) : (
              columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.title}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {apiError ? (
        <p className="form-error" role="alert">
          {apiError}
        </p>
      ) : null}

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
          {saving
            ? mode === 'create'
              ? 'Creating task...'
              : 'Saving changes...'
            : mode === 'create'
              ? 'Create task'
              : 'Save changes'}
        </button>
      </div>
    </form>
  );
}