import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Filter, Task } from '../types';
import { useBoard } from '../hooks/useBoard';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../hooks/useToast';
import { Board } from '../components/Board';
import { BoardColumn } from '../components/BoardColumn';
import { BoardLoading } from '../components/BoardLoading';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { PriorityFilter } from '../components/PriorityFilter';
import { SearchInput } from '../components/SearchInput';
import { ListIcon, PlusIcon, RefreshIcon } from '../components/icons';

export function BoardPage() {
  const { board, loading, error, refresh, moveTask, columnTitleById } = useBoard();
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<Filter>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [showTaskCounts] = useLocalStorage<boolean>('taskflow-show-task-counts', true);

  const statuses = useMemo(() => board?.columns.map((column) => column.title) ?? [], [board]);

  const filtersActive = search.trim() !== '' || priority !== 'ALL' || status !== 'ALL';

  const visibleColumns = useMemo(() => {
    if (!board) {
      return [];
    }
    const query = search.trim().toLowerCase();
    return board.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => {
        const matchesPriority = priority === 'ALL' || task.priority === priority;
        const matchesStatus = status === 'ALL' || column.title === status;
        const matchesSearch = !query || task.title.toLowerCase().includes(query);
        return matchesPriority && matchesStatus && matchesSearch;
      }),
    }));
  }, [board, search, priority, status]);

  const totalVisible = visibleColumns.reduce((sum, column) => sum + column.tasks.length, 0);

  const summary = useMemo(() => {
    if (!board) {
      return null;
    }
    const total = board.columns.reduce((sum, column) => sum + column.tasks.length, 0);
    const parts = board.columns.map((column) => `${column.tasks.length} ${column.title}`);
    return `${total} tasks · ${parts.join(' · ')}`;
  }, [board]);

  async function handleMove(task: Task, columnId: number): Promise<void> {
    try {
      await moveTask(task.id, columnId);
      toast.success(`Task moved to ${columnTitleById(columnId) || 'new column'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to move the task.');
    }
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

  function clearFilters(): void {
    setSearch('');
    setPriority('ALL');
    setStatus('ALL');
  }

  const columns = board?.columns ?? [];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">TaskFlow Board</h1>
          <p className="page-subtitle">Manage your tasks, track progress, and keep work moving.</p>
        </div>
        <button
          type="button"
          className="button button-primary button-new-task"
          onClick={() => navigate('/tasks/new')}
        >
          <PlusIcon width={16} height={16} />
          New task
        </button>
      </header>

      {board ? (
        <>
          <p className="board-summary">{summary}</p>

          <div className="toolbar board-toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="Search tasks by title..." />
            <PriorityFilter value={priority} onChange={setPriority} label="" id="board-priority-filter" />
            <div className="select-control">
              <select
                id="board-status-filter"
                value={status}
                aria-label="Filter by status"
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
              aria-label="Refresh board"
              title="Refresh"
              disabled={refreshing}
            >
              <RefreshIcon width={17} height={17} />
            </button>
            {filtersActive ? (
              <button type="button" className="button button-ghost clear-filters" onClick={clearFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {loading ? (
        <BoardLoading />
      ) : error ? (
        <ErrorState
          title="Unable to load your board"
          message="Something went wrong while loading your tasks."
          onRetry={() => void refresh()}
        />
      ) : !board ? (
        <div className="page-empty">
          <EmptyState
            title="Your board is empty"
            message="Create your first task and start organizing your work."
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
      ) : filtersActive && totalVisible === 0 ? (
        <div className="page-empty">
          <EmptyState
            icon={<ListIcon width={28} height={28} />}
            title="No matching tasks"
            message="Try changing your search or filters."
            action={
              <button type="button" className="button button-secondary" onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <Board>
          {visibleColumns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              allColumns={columns}
              showCount={showTaskCounts}
              filtersActive={filtersActive}
              onAdd={(columnId) => navigate(`/tasks/new?column=${columnId}`)}
              onEdit={(task) => navigate(`/tasks/${task.id}/edit`)}
              onDelete={(task) => navigate(`/tasks/${task.id}/delete`)}
              onMove={handleMove}
            />
          ))}
        </Board>
      )}
    </div>
  );
}