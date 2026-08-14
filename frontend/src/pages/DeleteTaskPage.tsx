import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Task } from '../types';
import { useBoard } from '../hooks/useBoard';
import { useToast } from '../hooks/useToast';
import { fetchTask } from '../services/api';
import { BackLink } from '../components/BackLink';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { PageLoading } from '../components/PageLoading';
import { PriorityBadge } from '../components/PriorityBadge';
import { TrashIcon } from '../components/icons';

type LoadStatus = 'loading' | 'ready' | 'notFound' | 'error';

export function DeleteTaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const id = Number(taskId);
  const { board, deleteTask } = useBoard();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [task, setTask] = useState<Task | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const backTo = location.state?.from ?? '/board';

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

  const columnTitle = board?.columns.find((column) => column.id === task?.columnId)?.title;

  async function handleDelete(): Promise<void> {
    if (!task) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteTask(task.id);
      toast.success('Task deleted');
      navigate(backTo);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unable to delete this task. Please try again.');
      setDeleting(false);
    }
  }

  if (status === 'notFound') {
    return (
      <div className="page task-page">
        <BackLink to={backTo} />
        <div className="page-empty">
          <EmptyState
            title="Task not found"
            message="This task may have already been deleted."
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
        <ErrorState message="We couldn't load this task." onRetry={() => void load()} />
      </div>
    );
  }

  if (status === 'loading' || !task) {
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
          <h1 className="page-title">Delete task</h1>
          <p className="page-subtitle">Are you sure you want to delete this task?</p>
        </div>
      </header>

      <section className="form-card delete-card" aria-labelledby="delete-task-title">
        <div className="form-card-body">
          <h2 id="delete-task-title" className="summary-title">
            {task.title}
          </h2>
          {task.description ? (
            <p className="summary-description">{task.description}</p>
          ) : (
            <p className="summary-description summary-description-empty">No description.</p>
          )}

          <div className="summary-meta">
            <div className="summary-meta-item">
              <span className="summary-meta-label">Priority</span>
              <span className="summary-meta-value">
                <PriorityBadge priority={task.priority} />
              </span>
            </div>
            <div className="summary-meta-item">
              <span className="summary-meta-label">Status</span>
              <span className="summary-meta-value">
                <span className="status-chip">{columnTitle ?? 'Unknown'}</span>
              </span>
            </div>
          </div>

          <p className="summary-danger">
            <TrashIcon width={16} height={16} />
            This action cannot be undone.
          </p>

          {deleteError ? (
            <p className="form-error" role="alert">
              {deleteError}
            </p>
          ) : null}

          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate(backTo)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button button-danger"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? 'Deleting task...' : 'Delete task'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}