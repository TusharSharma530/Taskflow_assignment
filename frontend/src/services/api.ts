import type {
  Board,
  BoardSummary,
  Priority,
  Task,
  TaskInput,
  TaskListItem,
  TaskUpdate,
} from '../types';

const BASE_URL = '/api';

/** Error thrown for any failed API request, carrying a user-safe message. */
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiError('Unable to reach the server. Please try again.');
  }

  if (!response.ok) {
    let message = 'Something went wrong. Please try again.';
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // keep the generic message when the body is not JSON
    }
    throw new ApiError(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function fetchBoards(): Promise<BoardSummary[]> {
  return request<BoardSummary[]>('/boards');
}

export function fetchBoard(boardId: number): Promise<Board> {
  return request<Board>(`/boards/${boardId}`);
}

export function fetchTasks(): Promise<TaskListItem[]> {
  return request<TaskListItem[]>('/tasks');
}

export function fetchTask(taskId: number): Promise<Task> {
  return request<Task>(`/tasks/${taskId}`);
}

export function createTask(input: TaskInput): Promise<Task> {
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTask(taskId: number, input: TaskUpdate): Promise<Task> {
  return request<Task>(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteTask(taskId: number): Promise<void> {
  return request<void>(`/tasks/${taskId}`, { method: 'DELETE' });
}

export function moveTask(taskId: number, columnId: number): Promise<Task> {
  return request<Task>(`/tasks/${taskId}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ columnId }),
  });
}

/** Shared list of priority options for selects and labels. */
export const PRIORITY_OPTIONS: Array<{ value: Priority | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];