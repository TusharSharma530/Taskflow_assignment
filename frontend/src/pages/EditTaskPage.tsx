import { useCallback, useEffect, useState } from 'react';
import { useBlocker, useLocation, useNavigate, useParams, type Location } from 'react-router-dom';
import type { Task, TaskInput } from '../types';
import { useBoard } from '../hooks/useBoard';
import { useToast } from '../hooks/useToast';
import { fetchTask } from '../services/api';
import { BackLink } from '../components/BackLink';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Modal } from '../components/Modal';
import { PageLoading } from '../components/PageLoading';
import { TaskFormFields } from '../components/TaskFormFields';

type LoadStatus = 'loading' | 'ready' | 'notFound' | 'error';

export function EditTaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const id = Number(taskId);
  const { board, loading: boardLoading, updateTask, moveTask } = useBoard();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [task, setTask] = useState<Task | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [dirty, setDirty] = useState(false);

  const backTo = location.state?.from ?? '/board';
  const columns = board?.columns ?? [];

  const load = useCallback(async (): Promise<void> => {
    if (!Number.isInteger(id) || id <= 0) {
      setStatus('notFound');
      return;
    }
    setStatus('loading');
    setTask(null);
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
        dirty && currentLocation.pathname !== nextLocation.pathname,
      [dirty],
    ),
  );

  const boardReady = !boardLoading;

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
    toast.success('Task updated');
    navigate(backTo);
  }

  if (status === 'notFound') {
    return (
      <div className="page task-page">
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
      <div className="page task-page">
        <BackLink to={backTo} />
        <ErrorState
          message="We couldn't load this task."
          onRetry={() => void load()}
        />
      </div>
    );
  }

  if (status === 'loading' || !task || !boardReady || !board) {
    return (
      <div className="page task-page">
        <BackLink to={backTo} />
        <PageLoading label="Loading task..." />
      </div>
    );
  }

  return (
    <div className="page task-page">
      <BackLink to={backTo} />

      <header className="page-header">
        <div>
          <h1 className="page-title">Edit task</h1>
          <p className="page-subtitle">Update the details of this task.</p>
        </div>
      </header>

      <section className="form-card" aria-labelledby="task-details-title">
        <header className="form-card-header">
          <h2 id="task-details-title" className="form-card-title">
            Task details
          </h2>
        </header>
        <div className="form-card-body">
          <TaskFormFields
            mode="edit"
            task={task}
            columns={columns}
            onCancel={() => navigate(backTo)}
            onSubmit={handleSubmit}
            onDirtyChange={setDirty}
          />
        </div>
      </section>

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