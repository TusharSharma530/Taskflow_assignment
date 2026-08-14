import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useLocation, useNavigate, useParams, type Location } from 'react-router-dom';
import type { Task, TaskInput } from '../types';
import { useBoard } from '../hooks/useBoard';
import { useToast } from '../hooks/useToast';
import { fetchTask } from '../services/api';
import { BackLink } from '../components/BackLink';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Modal } from '../components/Modal';
import {
  TaskFormFields,
  type TaskFieldDraft,
  type TaskFormFieldsHandle,
} from '../components/TaskFormFields';
import { TaskSummary } from '../components/TaskSummary';
import { ChevronRightIcon } from '../components/icons';

type LoadStatus = 'loading' | 'ready' | 'notFound' | 'error';

export function EditTaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const id = Number(taskId);
  const { board, loading: boardLoading, updateTask, moveTask } = useBoard();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const formRef = useRef<TaskFormFieldsHandle>(null);
  const skipBlocker = useRef(false);

  const [task, setTask] = useState<Task | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<TaskFieldDraft | null>(null);

  const backTo = location.state?.from ?? '/board';
  const columns = board?.columns ?? [];

  const load = useCallback(async (): Promise<void> => {
    if (!Number.isInteger(id) || id <= 0) {
      setStatus('notFound');
      return;
    }
    setStatus('loading');
    setTask(null);
    setDraft(null);
    try {
      const fetched = await fetchTask(id);
      setTask(fetched);
      setStatus('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setStatus(message === 'Task not found' ? 'notFound' : 'error');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }: { currentLocation: Location; nextLocation: Location }) =>
        !skipBlocker.current && dirty && currentLocation.pathname !== nextLocation.pathname,
      [dirty],
    ),
  );

  const boardReady = !boardLoading;

  const displayColumnId = draft?.columnId ?? task?.columnId;
  const displayPriority = draft?.priority ?? task?.priority;
  const columnTitle =
    columns.find((column) => column.id === displayColumnId)?.title ?? 'Unknown';

  async function handleSubmit(input: TaskInput): Promise<void> {
    if (!task) {
      return;
    }
    await updateTask(task.id, {
      title: input.title,
      description: input.description,
      priority: input.priority,
    });
    if (input.columnId !== task.columnId) {
      await moveTask(task.id, input.columnId);
    }
    skipBlocker.current = true;
    setDirty(false);
    toast.success('Task updated successfully');
    navigate(backTo);
  }

  const editForm = (
    <section className="form-card" aria-labelledby="task-details-title">
      <header className="form-card-header">
        <div>
          <h2 id="task-details-title" className="form-card-title">
            Task details
          </h2>
          <p className="form-card-subtitle">Update the information for this task.</p>
        </div>
      </header>
      <div className="form-card-body">
        <TaskFormFields
          id="edit-task-form"
          ref={formRef}
          mode="edit"
          task={task ?? undefined}
          columns={columns}
          renderActions={false}
          onCancel={() => navigate(backTo)}
          onSubmit={handleSubmit}
          onDirtyChange={setDirty}
          onSavingChange={setSaving}
          onFieldChange={setDraft}
        />
      </div>
    </section>
  );

  if (status === 'notFound') {
    return (
      <div className="page form-page">
        <BackLink to={backTo} />
        <div className="page-empty">
          <EmptyState
            title="Task not found"
            message="The task you're looking for may have been deleted."
            action={
              <button type="button" className="button button-secondary" onClick={() => navigate(backTo)}>
                Back to Board
              </button>
            }
          />
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="page form-page">
        <BackLink to={backTo} />
        <ErrorState
          title="Unable to load task"
          message="We couldn't load this task. Please try again."
          onRetry={() => void load()}
        />
        <div className="edit-error-actions">
          <button type="button" className="button button-secondary" onClick={() => navigate(backTo)}>
            Back to Board
          </button>
        </div>
      </div>
    );
  }

  if (status === 'loading' || !task || !boardReady || !board) {
    return (
      <div className="page form-page">
        <BackLink to={backTo} />
        <header className="page-header">
          <div>
            <h1 className="page-title">Edit task</h1>
            <p className="page-subtitle">Update the details and status of this task.</p>
          </div>
        </header>

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

      <header className="page-header">
        <div>
          <h1 className="page-title">Edit task</h1>
          <p className="page-subtitle">Update the details and status of this task.</p>
        </div>
        {dirty ? (
          <span className="unsaved-indicator" role="status">
            <span className="unsaved-dot" aria-hidden="true" />
            Unsaved changes
          </span>
        ) : null}
      </header>

      <div className="task-page-layout">
        <div className="task-page-main">{editForm}</div>

        <aside className="task-page-aside">
          <TaskSummary task={task} columnTitle={columnTitle} priority={displayPriority} />
        </aside>
      </div>

      <section className="danger-zone" aria-labelledby="danger-zone-title">
        <div>
          <h2 id="danger-zone-title" className="danger-zone-title">
            Danger zone
          </h2>
          <p className="danger-zone-text">Delete this task permanently.</p>
        </div>
        <Link
          className="danger-zone-link"
          to={`/tasks/${task.id}/delete`}
          state={{ from: backTo }}
        >
          Delete task
          <ChevronRightIcon width={15} height={15} />
        </Link>
      </section>

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
          disabled={!dirty || saving}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {blocker.state === 'blocked' ? (
        <Modal
          title="Unsaved changes"
          description="You have unsaved changes."
          width="sm"
          onClose={() => blocker.reset()}
        >
          <div className="dialog-body">
            <p className="dialog-text">You have unsaved changes. Are you sure you want to leave?</p>
            <p className="dialog-muted">Your changes won't be saved.</p>
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