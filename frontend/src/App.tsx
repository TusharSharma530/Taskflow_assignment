import { useCallback, useEffect, useState } from 'react';
import {
  createTask,
  deleteTask as deleteTaskApi,
  fetchBoard,
  fetchBoards,
  fetchColumnCounts,
  updateTask,
} from './api';
import { Column } from './components/Column';
import { Modal } from './components/Modal';
import { TaskForm } from './components/TaskForm';
import type { Board, ColumnCount, Priority, Task, TaskInput, TaskUpdate } from './types';
import './styles.css';

type Filter = 'ALL' | Priority;

type ModalState =
  | { mode: 'create'; columnId: number }
  | { mode: 'edit'; task: Task }
  | null;

function matchFilter(task: Task, filter: Filter): boolean {
  return filter === 'ALL' || task.priority === filter;
}

export default function App() {
  const [board, setBoard] = useState<Board | null>(null);
  const [counts, setCounts] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [modal, setModal] = useState<ModalState>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setLoadError(null);
    try {
      const boards = await fetchBoards();
      if (boards.length === 0) {
        setBoard(null);
        setCounts(new Map());
        return;
      }
      const firstBoard = await fetchBoard(boards[0].id);
      const columnCounts = await fetchColumnCounts(boards[0].id);
      setBoard(firstBoard);
      setCounts(
        new Map(columnCounts.map((c: ColumnCount) => [c.columnId, c.taskCount])),
      );
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load the board.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleCreate(input: TaskInput): Promise<void> {
    setActionError(null);
    try {
      await createTask(input);
      setModal(null);
      await reload();
    } catch (err) {
      throw err;
    }
  }

  async function handleUpdate(taskId: number, input: TaskUpdate): Promise<void> {
    setActionError(null);
    try {
      await updateTask(taskId, input);
      setModal(null);
      await reload();
    } catch (err) {
      throw err;
    }
  }

  async function handleDelete(task: Task): Promise<void> {
    setActionError(null);
    try {
      await deleteTaskApi(task.id);
      await reload();
    } catch (err) {
      throw err;
    }
  }

  let columns: Board['columns'] = [];
  if (board) {
    columns = board.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => matchFilter(task, filter)),
    }));
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">TaskFlow</h1>
        {board ? <p className="app-subtitle">{board.title}</p> : null}
      </header>

      <div className="toolbar">
        <label className="toolbar-item">
          <span className="toolbar-label">Priority:</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
          >
            <option value="ALL">All</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </label>
      </div>

      {loadError ? (
        <div className="banner banner-error" role="alert">
          <span>{loadError}</span>
          <button type="button" className="button button-ghost button-small" onClick={() => { setLoading(true); void reload(); }}>
            Retry
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className="banner banner-error" role="alert">
          {actionError}
        </div>
      ) : null}

      {loading ? (
        <p className="status">Loading board...</p>
      ) : !board ? (
        <p className="status">No board found. Run <code>npm run seed</code> to create the demo board.</p>
      ) : (
        <main className="board">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              allColumns={board.columns}
              count={counts.get(column.id) ?? 0}
              onAddTask={(columnId) => setModal({ mode: 'create', columnId })}
              onEditTask={(task) => setModal({ mode: 'edit', task })}
              onDeleteTask={handleDelete}
            />
          ))}
        </main>
      )}

      {modal ? (
        <Modal
          title={modal.mode === 'create' ? 'Add Task' : 'Edit Task'}
          onClose={() => setModal(null)}
        >
          <TaskForm
            columns={board?.columns ?? []}
            mode={modal.mode}
            defaultColumnId={modal.mode === 'create' ? modal.columnId : undefined}
            task={modal.mode === 'edit' ? modal.task : undefined}
            onSubmit={(input) =>
              modal.mode === 'create'
                ? handleCreate(input as TaskInput)
                : handleUpdate(modal.task.id, input)
            }
            onCancel={() => setModal(null)}
          />
        </Modal>
      ) : null}
    </div>
  );
}