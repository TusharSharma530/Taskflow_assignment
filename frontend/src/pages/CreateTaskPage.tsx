import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { Priority, TaskInput } from '../types';
import { useBoard } from '../hooks/useBoard';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../hooks/useToast';
import { BackLink } from '../components/BackLink';
import { ErrorState } from '../components/ErrorState';
import { PageLoading } from '../components/PageLoading';
import { TaskFormFields } from '../components/TaskFormFields';

export function CreateTaskPage() {
  const { board, loading, createTask, refresh } = useBoard();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [defaultPriority] = useLocalStorage<Priority>('taskflow-default-priority', 'MEDIUM');
  const [defaultColumnTitle] = useLocalStorage<string>('taskflow-default-column', 'To Do');

  const backTo = location.state?.from ?? '/board';
  const columns = board?.columns ?? [];

  if (!board) {
    return loading ? (
      <PageLoading label="Loading your board..." />
    ) : (
      <ErrorState message="We couldn't load your board. Please try again." onRetry={() => void refresh()} />
    );
  }

  const queryColumnId = Number(searchParams.get('column')) || 0;
  const defaultColumnId =
    queryColumnId ||
    columns.find((column) => column.title === defaultColumnTitle)?.id ||
    columns[0]?.id ||
    0;

  async function handleSubmit(input: TaskInput): Promise<void> {
    await createTask(input);
    toast.success('Task created');
    navigate('/board');
  }

  return (
    <div className="page task-page">
      <BackLink to={backTo} />

      <header className="page-header">
        <div>
          <h1 className="page-title">Create new task</h1>
          <p className="page-subtitle">Add a task to your board and keep your work organized.</p>
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
            mode="create"
            columns={columns}
            defaultColumnId={defaultColumnId}
            initialPriority={defaultPriority}
            onCancel={() => navigate(backTo)}
            onSubmit={handleSubmit}
          />
        </div>
      </section>
    </div>
  );
}