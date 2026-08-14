export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export const PRIORITY_ORDER: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

export function isPriority(value: unknown): value is Priority {
  return value === 'LOW' || value === 'MEDIUM' || value === 'HIGH';
}

export interface BoardSummary {
  id: number;
  title: string;
  createdAt: string;
}

export interface Task {
  id: number;
  columnId: number;
  title: string;
  description: string | null;
  priority: Priority;
  createdAt: string;
}

export interface TaskListItem extends Task {
  columnTitle: string;
  boardId: number;
}

export interface Column {
  id: number;
  boardId: number;
  title: string;
  position: number;
  createdAt: string;
  tasks: Task[];
}

export interface Board {
  id: number;
  title: string;
  createdAt: string;
  columns: Column[];
}

export interface TaskInput {
  columnId: number;
  title: string;
  description: string | null;
  priority: Priority;
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  priority?: Priority;
}

export type Filter = 'ALL' | Priority;