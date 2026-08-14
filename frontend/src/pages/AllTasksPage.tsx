import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Filter } from '../types';
import { useBoard } from '../hooks/useBoard';
import { useToast } from '../hooks/useToast';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { PriorityBadge } from '../components/PriorityBadge';
import { PriorityFilter } from '../components/PriorityFilter';
import { SearchInput } from '../components/SearchInput';
import { TaskCardMenu } from '../components/TaskCardMenu';
import { ListIcon, RefreshIcon } from '../components/icons';

function formatCreated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function AllTasksPage() {
  const { tasks, loading, error, refresh, board, moveTask, columnTitleById } = useBoard();
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<Filter>('ALL');
  const [status, setStatus] = useState<string>('ALL');

  const statuses = useMemo(() => {
    const fromBoard = board?.columns.map((column) => column.title);
    const fromTasks = Array.from(new Set(tasks.map((task) => task.columnTitle)));
    const merged = fromBoard ?? fromTasks;
    return Array.from(new Set([...merged, ...fromTasks]));
  }, [board, tasks]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch = !query || task.title.toLowerCase().includes(query);
      const matchesPriority = priority === 'ALL' || task.priority === priority;
      const matchesStatus = status === 'ALL' || task.columnTitle === status;
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [tasks, search, priority, status]);

  async function handleMove(task: { id: number; columnId: number }, columnId: number): Promise<void> {
    try {
      await moveTask(task.id, columnId);
      toast.success(`Task moved to ${columnTitleById(columnId) || 'new column'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to move the task.');
    }
  }

  const editTask = (task: { id: number }): void =>
    navigate(`/tasks/${task.id}/edit`, { state: { from: '/tasks' } });

  const deleteTask = (task: { id: number }): void =>
    navigate(`/tasks/${task.id}/delete`, { state: { from: '/tasks' } });

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">All Tasks</h1>
          <p className="page-subtitle">View and manage every task on your board.</p>
        </div>
      </header>

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search tasks..." />
        <PriorityFilter value={priority} onChange={setPriority} label="" id="tasks-priority-filter" />
        <div className="select-control">
          <select
            aria-label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            {statuses.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="icon-button toolbar-refresh"
          onClick={() => void refresh()}
          aria-label="Refresh tasks"
          title="Refresh"
        >
          <RefreshIcon width={17} height={17} />
        </button>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="table-card">
          <div className="skeleton skeleton-line" style={{ width: '100%', height: 360 }} />
        </div>
      ) : error ? (
        <ErrorState
          message="We couldn't load your tasks. Please try again."
          onRetry={() => void refresh()}
        />
      ) : visible.length === 0 ? (
        <div className="page-empty">
          <EmptyState
            icon={<ListIcon width={28} height={28} />}
            title={tasks.length === 0 ? 'No tasks yet' : 'No tasks found'}
            message={
              tasks.length === 0
                ? 'Create your first task to see it here.'
                : 'Try changing your search or filters.'
            }
          />
        </div>
      ) : (
        <div className="table-card">
          <div className="table-scroll">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th scope="col">Task</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col" aria-label="Actions">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((task) => (
                  <tr key={task.id}>
                    <td data-label="Task">
                      <div className="table-task">
                        <span className="table-task-title">{task.title}</span>
                        {task.description ? (
                          <span className="table-task-desc">{task.description}</span>
                        ) : null}
                      </div>
                    </td>
                    <td data-label="Priority">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td data-label="Status">
                      <span className="status-chip">{task.columnTitle}</span>
                    </td>
                    <td data-label="Created">
                      <span className="table-date">{formatCreated(task.createdAt)}</span>
                    </td>
                    <td className="table-actions">
                      <TaskCardMenu
                        task={task}
                        columns={board?.columns ?? []}
                        variant="row"
                        onEdit={() => editTask(task)}
                        onDelete={() => deleteTask(task)}
                        onMove={(columnId) => void handleMove(task, columnId)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}