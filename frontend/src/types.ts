export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

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

export interface ColumnCount {
  columnId: number;
  columnTitle: string;
  taskCount: number;
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