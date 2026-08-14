import type Database from 'better-sqlite3';
import { badRequest, notFound } from '../errors/http.error';
import type { Priority, TaskRow, TaskListItem } from '../repositories/task.repository';
import * as taskRepo from '../repositories/task.repository';
import type { ValidatedTaskInput } from '../validation/task.validation';
import { requireColumn } from './board.service';

export function listTasks(db: Database.Database): TaskListItem[] {
  return taskRepo.listTasks(db);
}

export function getTask(db: Database.Database, taskId: number): TaskRow {
  const task = taskRepo.getTaskById(db, taskId);
  if (!task) {
    throw notFound('Task not found');
  }
  return task;
}

export function createTask(
  db: Database.Database,
  input: ValidatedTaskInput,
): TaskRow {
  requireColumn(db, input.columnId);
  return taskRepo.createTask(db, input);
}

export function updateTask(
  db: Database.Database,
  taskId: number,
  input: { title?: string; description: string | null; priority: Priority },
): TaskRow {
  if (!taskRepo.getTaskById(db, taskId)) {
    throw notFound('Task not found');
  }
  const updated = taskRepo.updateTask(db, taskId, input);
  if (!updated) {
    throw new Error('Failed to update task');
  }
  return updated;
}

export function deleteTask(db: Database.Database, taskId: number): void {
  if (!taskRepo.deleteTask(db, taskId)) {
    throw notFound('Task not found');
  }
}

export function moveTask(
  db: Database.Database,
  taskId: number,
  columnId: number,
): TaskRow {
  const task = taskRepo.getTaskById(db, taskId);
  if (!task) {
    throw notFound('Task not found');
  }

  const target = requireColumn(db, columnId);
  const current = requireColumn(db, task.columnId);
  if (target.boardId !== current.boardId) {
    throw badRequest('Task can only be moved to a column on the same board');
  }

  const moved = taskRepo.moveTask(db, taskId, columnId);
  if (!moved) {
    throw new Error('Failed to move task');
  }
  return moved;
}