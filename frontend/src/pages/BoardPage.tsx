import { useMemo, useState } from 'react';
import type { Filter, Priority, Task, TaskInput, TaskUpdate } from '../types';
import { useBoard } from '../hooks/useBoard';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../hooks/useToast';
import { Board } from '../components/Board';
import { BoardColumn } from '../components/BoardColumn';
import { BoardLoading } from '../components/BoardLoading';
import { DeleteTaskDialog } from '../components/DeleteTaskDialog';
import { EditTaskModal } from '../components/EditTaskModal';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { PriorityFilter } from '../components/PriorityFilter';
import { SearchInput } from '../components/SearchInput';
import { TaskModal } from '../components/TaskModal';
import { ListIcon, PlusIcon, RefreshIcon } from '../components/icons';

interface BoardPageState {
  dialog: { type: 'create'; columnId: number } | { type: 'edit'; task: Task } | null;
  deleting: Task | null;
}

export function BoardPage() {
  const { board, loading, error, refresh, createTask, updateTask, deleteTask, moveTask, columnTitleById } =
    useBoard();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [state, setState] = useState<BoardPageState>({ dialog: null, deleting: null });
  const [defaultPriority] = useLocalStorage<Priority>('taskflow-default-priority', 'MEDIUM');

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

  async function handleCreate(input: TaskInput): Promise<void> {
    try {
      await createTask(input);
      setState((current) => ({ ...current, dialog: null }));
      toast.success('Task created successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to create the task.');
      throw err;
    }
  }

  async function handleUpdate(task: Task, input: TaskUpdate): Promise<void> {
    try {
      await updateTask(task.id, input);
      setState((current) => ({ ...current, dialog: null }));
      toast.success('Task updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to save changes.');
      throw err;
    }
  }

  async function handleDelete(task: Task): Promise<void> {
    try {
      await deleteTask(task.id);
      setState((current) => ({ ...current, deleting: null }));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to delete the task.');
      throw err;
    }
  }

  async function handleMove(task: Task, columnId: number): Promise<void> {
    try {
      await moveTask(task.id, columnId);
      toast.success(`Task moved to ${columnTitleById(columnId) || 'new column'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to move the task.');
    }
  }

  const columns = board?.columns ?? [];
  const creatingColumnId = state.dialog?.type === 'create' ? state.dialog.columnId : null;
  const editingTask = state.dialog?.type === 'edit' ? state.dialog.task : null;
  const deletingTask = state.deleting;

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
          onClick={() => setState((current) => ({ ...current, dialog: { type: 'create', columnId: columns[0]?.id ?? 0 } }))}
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
                onClick={() => setState((current) => ({ ...current, dialog: { type: 'create', columnId: 0 } }))}
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
              onAdd={(columnId) =>
                setState((current) => ({ ...current, dialog: { type: 'create', columnId } }))
              }
              onEdit={(task) => setState((current) => ({ ...current, dialog: { type: 'edit', task } }))}
              onDelete={(task) => setState((current) => ({ ...current, deleting: task }))}
              onMove={handleMove}
            />
          ))}
        </Board>
      )}

      {creatingColumnId !== null ? (
        <TaskModal
          columns={columns}
          defaultColumnId={creatingColumnId}
          initialPriority={defaultPriority}
          onSubmit={handleCreate}
          onClose={() => setState((current) => ({ ...current, dialog: null }))}
        />
      ) : editingTask ? (
        <EditTaskModal
          task={editingTask}
          onSubmit={(input) => handleUpdate(editingTask, input)}
          onClose={() => setState((current) => ({ ...current, dialog: null }))}
        />
      ) : null}

      {deletingTask ? (
        <DeleteTaskDialog
          task={deletingTask}
          onConfirm={() => handleDelete(deletingTask)}
          onClose={() => setState((current) => ({ ...current, deleting: null }))}
        />
      ) : null}
    </div>
  );
}