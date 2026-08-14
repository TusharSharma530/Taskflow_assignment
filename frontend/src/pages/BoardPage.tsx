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
  const [filter, setFilter] = useState<Filter>('ALL');
  const [showTaskCounts] = useLocalStorage<boolean>('taskflow-show-task-counts', true);

  const visibleColumns = useMemo(() => {
    if (!board) {
      return [];
    }
    const query = search.trim().toLowerCase();
    return board.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => {
        const matchesPriority = filter === 'ALL' || task.priority === filter;
        const matchesSearch = !query || task.title.toLowerCase().includes(query);
        return matchesPriority && matchesSearch;
      }),
    }));
  }, [board, search, filter]);

  const totalVisible = visibleColumns.reduce((sum, column) => sum + column.tasks.length, 0);

  async function handleMove(task: Task, columnId: number): Promise<void> {
    try {
      await moveTask(task.id, columnId);
      toast.success(`Task moved to ${columnTitleById(columnId) || 'new column'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to move the task.');
    }
  }

  const columns = board?.columns ?? [];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">TaskFlow Board</h1>
          <p className="page-subtitle">Manage your team's tasks and keep work moving.</p>
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

      {board ? (
        <div className="toolbar">
          <SearchInput value={search} onChange={setSearch} />
          <PriorityFilter value={filter} onChange={setFilter} label="" id="board-priority-filter" />
          <button
            type="button"
            className="icon-button toolbar-refresh"
            onClick={() => void refresh()}
            aria-label="Refresh board"
            title="Refresh"
          >
            <RefreshIcon width={17} height={17} />
          </button>
        </div>
      ) : null}

      {loading ? (
        <BoardLoading />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refresh()} />
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
      ) : totalVisible === 0 ? (
        <div className="page-empty">
          <EmptyState
            icon={<ListIcon width={28} height={28} />}
            title="No tasks found"
            message="Try changing your search or filter."
            action={
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setSearch('');
                  setFilter('ALL');
                }}
              >
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