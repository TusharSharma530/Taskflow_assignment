import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as api from '../services/api';
import type { Board, Task, TaskInput, TaskListItem, TaskUpdate } from '../types';

interface BoardContextValue {
  board: Board | null;
  tasks: TaskListItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTask: (input: TaskInput) => Promise<Task>;
  updateTask: (taskId: number, input: TaskUpdate) => Promise<Task>;
  deleteTask: (taskId: number) => Promise<void>;
  moveTask: (taskId: number, columnId: number) => Promise<Task>;
  columnTitleById: (columnId: number) => string;
}

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const boardIdRef = useRef<number | null>(null);
  const requestSeq = useRef(0);

  const load = useCallback(async (quiet = false) => {
    const seq = ++requestSeq.current;
    if (!quiet) {
      setLoading(true);
    }
    setError(null);
    try {
      const boards = await api.fetchBoards();
      if (boards.length === 0) {
        if (seq === requestSeq.current) {
          setBoard(null);
          setTasks([]);
          boardIdRef.current = null;
        }
        return;
      }

      if (boardIdRef.current === null || !boards.some((b) => b.id === boardIdRef.current)) {
        boardIdRef.current = boards[0].id;
      }

      const [nextBoard, nextTasks] = await Promise.all([
        api.fetchBoard(boardIdRef.current),
        api.fetchTasks(),
      ]);

      if (seq === requestSeq.current) {
        setBoard(nextBoard);
        setTasks(nextTasks);
      }
    } catch (err) {
      if (seq === requestSeq.current) {
        setError(err instanceof Error ? err.message : 'Unable to load the board.');
      }
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reloadAfterMutation = useCallback(async () => {
    await load(true);
  }, [load]);

  const createTask = useCallback(
    async (input: TaskInput): Promise<Task> => {
      const created = await api.createTask(input);
      await reloadAfterMutation();
      return created;
    },
    [reloadAfterMutation],
  );

  const updateTask = useCallback(
    async (taskId: number, input: TaskUpdate): Promise<Task> => {
      const updated = await api.updateTask(taskId, input);
      await reloadAfterMutation();
      return updated;
    },
    [reloadAfterMutation],
  );

  const deleteTask = useCallback(
    async (taskId: number): Promise<void> => {
      await api.deleteTask(taskId);
      await reloadAfterMutation();
    },
    [reloadAfterMutation],
  );

  const moveTask = useCallback(
    async (taskId: number, columnId: number): Promise<Task> => {
      const moved = await api.moveTask(taskId, columnId);
      await reloadAfterMutation();
      return moved;
    },
    [reloadAfterMutation],
  );

  const columnTitleById = useCallback(
    (columnId: number): string => {
      const column = board?.columns.find((c) => c.id === columnId);
      return column?.title ?? '';
    },
    [board],
  );

  const value = useMemo(
    () => ({
      board,
      tasks,
      loading,
      error,
      refresh: () => load(true),
      createTask,
      updateTask,
      deleteTask,
      moveTask,
      columnTitleById,
    }),
    [board, tasks, loading, error, load, createTask, updateTask, deleteTask, moveTask, columnTitleById],
  );

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoard(): BoardContextValue {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
}