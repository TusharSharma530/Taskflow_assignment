import { useCallback, useRef, useState } from 'react';
import { useBlocker, useLocation, useNavigate, useSearchParams, type Location } from 'react-router-dom';
import type { Priority, TaskInput } from '../types';
import { useBoard } from '../hooks/useBoard';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../hooks/useToast';
import { BackLink } from '../components/BackLink';
import { ErrorState } from '../components/ErrorState';
import { Modal } from '../components/Modal';
import {
  TaskFormFields,
  type TaskFieldDraft,
  type TaskFormFieldsHandle,
} from '../components/TaskFormFields';
import { TaskPreview } from '../components/TaskPreview';

export function CreateTaskPage() {
  const { board, loading, createTask, refresh } = useBoard();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [defaultPriority] = useLocalStorage<Priority>('taskflow-default-priority', 'MEDIUM');
  const [defaultColumnTitle] = useLocalStorage<string>('taskflow-default-column', 'To Do');

  const formRef = useRef<TaskFormFieldsHandle>(null);
  const skipBlocker = useRef(false);

  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<TaskFieldDraft | null>(null);

  const backTo = location.state?.from ?? '/board';
  const columns = board?.columns ?? [];
  const hasInput = draft ? draft.title.trim().length > 0 || draft.description.trim().length > 0 : false;

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }: { currentLocation: Location; nextLocation: Location }) =>
        !skipBlocker.current && hasInput && currentLocation.pathname !== nextLocation.pathname,
      [hasInput],
    ),
  );

  const queryColumnId = Number(searchParams.get('column')) || 0;
  const defaultColumnId =
    queryColumnId ||
    columns.find((column) => column.title === defaultColumnTitle)?.id ||
    columns[0]?.id ||
    0;

  const displayColumnId = draft?.columnId ?? defaultColumnId;
  const columnTitle = columns.find((column) => column.id === displayColumnId)?.title ?? 'Unknown';

  async function handleSubmit(input: TaskInput): Promise<void> {
    await createTask(input);
    skipBlocker.current = true;
    toast.success('Task created successfully');
    navigate('/board');
  }

  const header = (
    <header className="page-header">
      <div>
        <h1 className="page-title">Create new task</h1>
        <p className="page-subtitle">Add a task to your board and keep your work organized.</p>
        <p className="form-required-hint">Fields marked with * are required.</p>
      </div>
    </header>
  );

  const form = (
    <section className="form-card" aria-labelledby="task-details-title">
      <header className="form-card-header">
        <div>
          <h2 id="task-details-title" className="form-card-title">
            Task details
          </h2>
          <p className="form-card-subtitle">Give your task a clear title and useful context.</p>
        </div>
      </header>
      <div className="form-card-body">
        <TaskFormFields
          id="create-task-form"
          ref={formRef}
          mode="create"
          columns={columns}
          defaultColumnId={defaultColumnId}
          initialPriority={defaultPriority}
          renderActions={false}
          onCancel={() => navigate(backTo)}
          onSubmit={handleSubmit}
          onSavingChange={setSaving}
          onFieldChange={setDraft}
        />
      </div>
    </section>
  );

  if (!board) {
    if (loading) {
      return (
        <div className="page form-page">
          <BackLink to={backTo} />
          {header}

          <div className="task-page-layout" aria-busy="true">
            <div className="task-page-main">
              <div className="form-card">
                <header className="form-card-header">
                  <span className="skeleton skeleton-title" style={{ width: '40%' }} />
                </header>
                <div className="form-card-body edit-skeleton-form">
                  <div className="skeleton skeleton-line" style={{ height: 52 }} />
                  <div className="skeleton skeleton-line" style={{ height: 128 }} />
                  <div className="skeleton skeleton-line" style={{ height: 40 }} />
                </div>
              </div>
            </div>

            <aside className="task-page-aside">
              <div className="form-card">
                <header className="form-card-header">
                  <span className="skeleton skeleton-title" style={{ width: '55%' }} />
                </header>
                <div className="form-card-body edit-skeleton-aside">
                  <div className="skeleton skeleton-line" style={{ height: 20 }} />
                  <div className="skeleton skeleton-line" style={{ height: 20 }} />
                  <div className="skeleton skeleton-line" style={{ height: 20 }} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      );
    }

    return (
      <div className="page form-page">
        <BackLink to={backTo} />
        <ErrorState
          title="Unable to load your board"
          message="We couldn't load your board. Please try again."
          onRetry={() => void refresh()}
        />
      </div>
    );
  }

  return (
    <div className="page form-page">
      <BackLink to={backTo} />
      {header}

      <div className="task-page-layout">
        <div className="task-page-main">{form}</div>

        <aside className="task-page-aside">
          <TaskPreview
            title={draft?.title ?? ''}
            description={draft?.description ?? ''}
            priority={draft?.priority ?? defaultPriority}
            columnTitle={columnTitle}
          />
        </aside>
      </div>

      <div className="task-page-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => navigate(backTo)}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={() => void formRef.current?.submit()}
          disabled={saving || !draft?.title?.trim()}
        >
          {saving ? 'Creating task...' : 'Create task'}
        </button>
      </div>

      {blocker.state === 'blocked' ? (
        <Modal
          title="Unsaved changes"
          description="You have typed some details."
          width="sm"
          onClose={() => blocker.reset()}
        >
          <div className="dialog-body">
            <p className="dialog-text">You have unsaved changes. Are you sure you want to leave?</p>
            <p className="dialog-muted">Your task won't be saved.</p>
            <div className="modal-actions">
              <button type="button" className="button button-secondary" onClick={() => blocker.reset()}>
                Keep editing
              </button>
              <button type="button" className="button button-primary" onClick={() => blocker.proceed()}>
                Leave anyway
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}