import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Filter, TaskListItem } from '../types';
import { useBoard } from '../hooks/useBoard';
import { useToast } from '../hooks/useToast';
import { statusTone } from '../utils/taskStatus';
import { DeleteTaskDialog } from '../components/DeleteTaskDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { PriorityBadge } from '../components/PriorityBadge';
import { PriorityFilter } from '../components/PriorityFilter';
import { SearchInput } from '../components/SearchInput';
import { EditIcon, ListIcon, PlusIcon, RefreshIcon, TrashIcon } from '../components/icons';

function formatCreated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatCreatedFull(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function AllTasksPage() {
  const { tasks, loading, error, refresh, board, moveTask, columnTitleById, deleteTask } = useBoard();
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<Filter>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TaskListItem | null>(null);

  const statuses = useMemo(() => {
    const fromBoard = board?.columns.map((column) => column.title);
    const fromTasks = Array.from(new Set(tasks.map((task) => task.columnTitle)));
    const merged = fromBoard ?? fromTasks;
    return Array.from(new Set([...merged, ...fromTasks]));
  }, [board, tasks]);

  const columnCounts = useMemo(() => {
    if (board) {
      return board.columns.map((column) => ({
        title: column.title,
        count: tasks.filter((task) => task.columnId === column.id).length,
      }));
    }
    return Array.from(new Set(tasks.map((task) => task.columnTitle))).map((title) => ({
      title,
      count: tasks.filter((task) => task.columnTitle === title).length,
    }));
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

  const filtersActive = search.trim() !== '' || priority !== 'ALL' || status !== 'ALL';
  const initialLoading = loading && tasks.length === 0;

  function clearFilters(): void {
    setSearch('');
    setPriority('ALL');
    setStatus('ALL');
  }

  async function handleRefresh(): Promise<void> {
    if (refreshing) {
      return;
    }
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

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

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) {
      return;
    }
    try {
      await deleteTask(deleteTarget.id);
      toast.success('Task deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the task. Please try again.");
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">All Tasks</h1>
          <p className="page-subtitle">View, filter, and manage every task on your board.</p>
        </div>
        <button
          type="button"
          className="button button-primary button-new-task"
          onClick={() => navigate('/tasks/new')}
        >
          <PlusIcon width={16} height={16} />
          New Task
        </button>
      </header>

      {!error && !initialLoading ? (
        <div className="stat-cards" aria-label="Task overview">
          <div className="stat-card">
            <span className="stat-card-label">Total tasks</span>
            <span className="stat-card-value">{tasks.length}</span>
          </div>
          {columnCounts.map((column) => (
            <div className="stat-card" key={column.title}>
              <span className="stat-card-label">{column.title}</span>
              <span className="stat-card-value">{column.count}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="tasks-toolbar">
        <div className="toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tasks by title..." />
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
            className={`icon-button toolbar-refresh${refreshing ? ' refreshing' : ''}`}
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            aria-label="Refresh tasks"
            title="Refresh tasks"
          >
            <RefreshIcon width={17} height={17} />
          </button>
          {filtersActive ? (
            <button type="button" className="button button-ghost clear-filters" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {!error && !initialLoading ? (
        <p className="tasks-summary" role="status">
          {filtersActive
            ? `Showing ${visible.length} of ${tasks.length} tasks`
            : `${tasks.length} tasks`}
        </p>
      ) : null}

      {initialLoading ? (
        <div className="table-card" aria-busy="true">
          <table className="tasks-table table-skeleton">
            <thead>
              <tr>
                <th>Task</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, index) => (
                <tr key={index}>
                  <td>
                    <div className="table-task">
                      <span className="skeleton skeleton-line" style={{ width: '60%' }} />
                      <span className="skeleton skeleton-line" style={{ width: '38%' }} />
                    </div>
                  </td>
                  <td>
                    <span className="skeleton skeleton-line" style={{ width: 66 }} />
                  </td>
                  <td>
                    <span className="skeleton skeleton-line" style={{ width: 80 }} />
                  </td>
                  <td>
                    <span className="skeleton skeleton-line" style={{ width: 52 }} />
                  </td>
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load tasks"
          message="Something went wrong while loading your tasks."
          onRetry={() => void refresh()}
        />
      ) : tasks.length === 0 ? (
        <div className="page-empty">
          <EmptyState
            icon={<ListIcon width={28} height={28} />}
            title="No tasks yet"
            message="Create your first task to get started."
            action={
              <button
                type="button"
                className="button button-primary"
                onClick={() => navigate('/tasks/new')}
              >
                <PlusIcon width={16} height={16} />
                Create task
              </button>
            }
          />
        </div>
      ) : visible.length === 0 ? (
        <div className="page-empty">
          <EmptyState
            icon={<ListIcon width={28} height={28} />}
            title="No tasks found"
            message="Try adjusting your search or filters."
            action={
              <button type="button" className="button button-secondary" onClick={clearFilters}>
                Clear filters
              </button>
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
                  <th scope="col" aria-label="Actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((task) => (
                  <tr key={task.id}>
                    <td data-label="Task">
                      <div className="table-task">
                        <button
                          type="button"
                          className="table-task-title"
                          onClick={() => editTask(task)}
                          title={task.title}
                        >
                          {task.title}
                        </button>
                        <span
                          className={
                            task.description
                              ? 'table-task-desc'
                              : 'table-task-desc table-task-no-desc'
                          }
                        >
                          {task.description ? task.description : 'No description'}
                        </span>
                      </div>
                    </td>
                    <td data-label="Priority">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td data-label="Status">
                      <span className={`status-chip status-chip-${statusTone(task.columnTitle)}`}>
                        <span className="status-chip-dot" aria-hidden="true" />
                        {task.columnTitle}
                      </span>
                    </td>
                    <td data-label="Created">
                      <span className="table-date" title={formatCreatedFull(task.createdAt)}>
                        {formatCreated(task.createdAt)}
                      </span>
                    </td>
                    <td className="table-actions">
                      <div className="task-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => editTask(task)}
                          aria-label={`Edit task "${task.title}"`}
                          title="Edit task"
                        >
                          <EditIcon width={15} height={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button icon-button-danger"
                          onClick={() => setDeleteTarget(task)}
                          aria-label={`Delete task "${task.title}"`}
                          title="Delete task"
                        >
                          <TrashIcon width={15} height={15} />
                        </button>
                        <select
                          className="move-select"
                          value=""
                          aria-label={`Move task "${task.title}" to another column`}
                          title="Move to another column"
                          disabled={(board?.columns ?? []).filter((column) => column.id !== task.columnId).length === 0}
                          onChange={(event) => {
                            const columnId = Number(event.target.value);
                            if (Number.isInteger(columnId)) {
                              void handleMove(task, columnId);
                            }
                          }}
                        >
                          <option value="" disabled>
                            Move to
                          </option>
                          {(board?.columns ?? [])
                            .filter((column) => column.id !== task.columnId)
                            .map((column) => (
                              <option key={column.id} value={column.id}>
                                {column.title}
                              </option>
                            ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteTarget ? (
        <DeleteTaskDialog
          task={deleteTarget}
          columnTitle={deleteTarget.columnTitle}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </div>
  );
}