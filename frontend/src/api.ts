import type {
  Board,
  BoardSummary,
  ColumnCount,
  Priority,
  Task,
  TaskInput,
  TaskUpdate,
} from './types';

const BASE_URL = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new Error('Unable to reach the server. Please try again.');
  }

  if (!response.ok) {
    let message = 'Something went wrong. Please try again.';
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // keep the generic message when the response is not JSON
    }
    throw new Error(message);
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

export function fetchColumnCounts(boardId: number): Promise<ColumnCount[]> {
  return request<ColumnCount[]>(`/boards/${boardId}/column-counts`);
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

export function isPriority(value: string): value is Priority {
  return value === 'LOW' || value === 'MEDIUM' || value === 'HIGH';
}
