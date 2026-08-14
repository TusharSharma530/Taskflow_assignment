import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import type { Column, Priority, Task, TaskInput } from '../types';
import { isPriority } from '../types';
import { Select } from './Select';

export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MAX_LENGTH = 500;

export interface TaskFieldDraft {
  title: string;
  description: string;
  priority: Priority;
  columnId: number;
}

export interface TaskFormFieldsHandle {
  /** Validates and submits the form. Resolves true on success, false otherwise. */
  submit: () => Promise<boolean>;
}

interface TaskFormFieldsProps {
  id?: string;
  mode: 'create' | 'edit';
  columns: Column[];
  task?: Task;
  defaultColumnId?: number;
  initialPriority?: Priority;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
  /** When false, the Cancel/Save buttons are left to the parent page to render. */
  renderActions?: boolean;
  onCancel: () => void;
  onSubmit: (input: TaskInput) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  onSavingChange?: (saving: boolean) => void;
  onFieldChange?: (draft: TaskFieldDraft) => void;
}

export const TaskFormFields = forwardRef<TaskFormFieldsHandle, TaskFormFieldsProps>(
  function TaskFormFields(
    {
      id = 'task-form',
      mode,
      columns = [],
      task,
      defaultColumnId,
      initialPriority,
      titlePlaceholder = 'e.g. Build authentication API',
      descriptionPlaceholder = 'Add more details about this task...',
      renderActions = true,
      onCancel,
      onSubmit,
      onDirtyChange,
      onSavingChange,
      onFieldChange,
    },
    ref,
  ) {
    const [title, setTitle] = useState(task?.title ?? '');
    const [description, setDescription] = useState(task?.description ?? '');
    const [priority, setPriority] = useState<Priority>(
      task?.priority ?? initialPriority ?? 'MEDIUM',
    );
    const [columnId, setColumnId] = useState<number>(defaultColumnId ?? task?.columnId ?? 0);
    const [titleError, setTitleError] = useState<string | null>(null);
    const [columnError, setColumnError] = useState<string | null>(null);
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

    useEffect(() => {
      onSavingChange?.(saving);
    }, [saving, onSavingChange]);

    useEffect(() => {
      onFieldChange?.({ title, description, priority, columnId });
    }, [title, description, priority, columnId, onFieldChange]);

    function validate(): boolean {
      let valid = true;
      if (title.trim().length === 0) {
        setTitleError(title.length === 0 ? 'Title is required.' : 'Title cannot be empty.');
        valid = false;
      } else {
        setTitleError(null);
      }
      if (!columns.some((column) => column.id === columnId)) {
        setColumnError('Please choose a column.');
        valid = false;
      } else {
        setColumnError(null);
      }
      return valid;
    }

    async function submit(): Promise<boolean> {
      if (!validate()) {
        return false;
      }
      const input: TaskInput = {
        columnId,
        title: title.trim(),
        description: description.trim() || null,
        priority,
      };
      setApiError(null);
      setSaving(true);
      try {
        await onSubmit(input);
        return true;
      } catch (err) {
        setApiError(
          err instanceof Error ? err.message : 'Unable to save changes. Please try again.',
        );
        return false;
      } finally {
        setSaving(false);
      }
    }

    useImperativeHandle(ref, () => ({ submit }));

    function handleFormSubmit(event: React.FormEvent): void {
      event.preventDefault();
      void submit();
    }

    return (
      <form id={id} className="task-form" onSubmit={handleFormSubmit} noValidate>
        <div className="form-field">
          <label className="form-label" htmlFor="task-title">
            Title <span className="required-mark">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (titleError) {
                setTitleError(null);
              }
            }}
            placeholder={titlePlaceholder}
            maxLength={TITLE_MAX_LENGTH}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? 'task-title-error' : undefined}
            autoFocus
          />
          <div className="field-meta field-meta-end">
            <span className="field-counter">
              {title.length} / {TITLE_MAX_LENGTH}
            </span>
          </div>
          {titleError ? (
            <p id="task-title-error" className="form-error" role="alert">
              {titleError}
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
            maxLength={DESCRIPTION_MAX_LENGTH}
            rows={6}
          />
          <div className="field-meta">
            <p className="field-help">Add context or details that help explain this task.</p>
            <span className="field-counter">
              {description.length} / {DESCRIPTION_MAX_LENGTH}
            </span>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label" htmlFor="task-priority">
              Priority
            </label>
            <Select
              id="task-priority"
              value={priority}
              priorityDot={priority}
              onChange={(value) => {
                if (isPriority(value)) {
                  setPriority(value);
                }
              }}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="task-column">
              {mode === 'edit' ? 'Current column' : 'Column'}
            </label>
            <Select
              id="task-column"
              value={columnId}
              onChange={(value) => {
                setColumnId(Number(value));
                if (columnError) {
                  setColumnError(null);
                }
              }}
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
            </Select>
            <div className="field-meta">
              <p className="field-help">Choose where this task appears on the board.</p>
            </div>
            {columnError ? (
              <p className="form-error" role="alert">
                {columnError}
              </p>
            ) : null}
          </div>
        </div>

        {apiError ? (
          <div className="form-error-banner" role="alert">
            <span className="form-error-banner-title">
              {mode === 'edit' ? 'Unable to save changes' : 'Unable to create task'}
            </span>
            <span>{apiError}</span>
          </div>
        ) : null}

        {renderActions ? (
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
                  : 'Saving...'
                : mode === 'create'
                  ? 'Create task'
                  : 'Save changes'}
            </button>
          </div>
        ) : null}
      </form>
    );
  },
);