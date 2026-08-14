import { badRequest, notFound } from '../errors/http.error';
import type { TaskRow, TaskListItem, UpdateTaskInput } from '../repositories/task.repository';
import * as taskRepo from '../repositories/task.repository';
import type { ValidatedTaskInput } from '../validation/task.validation';
import type { Db } from '../db/database';
import { requireColumn } from './board.service';

export async function listTasks(db: Db): Promise<TaskListItem[]> {
  return taskRepo.listTasks(db);
}

export async function getTask(db: Db, taskId: number): Promise<TaskRow> {
  const task = await taskRepo.getTaskById(db, taskId);
  if (!task) {
    throw notFound('Task not found');
  }
  return task;
}

export async function createTask(
  db: Db,
  input: ValidatedTaskInput,
): Promise<TaskRow> {
  await requireColumn(db, input.columnId);
  return taskRepo.createTask(db, input);
}

export async function updateTask(
  db: Db,
  taskId: number,
  input: UpdateTaskInput,
): Promise<TaskRow> {
  if (!(await taskRepo.getTaskById(db, taskId))) {
    throw notFound('Task not found');
  }
  const updated = await taskRepo.updateTask(db, taskId, input);
  if (!updated) {
    throw new Error('Failed to update task');
  }
  return updated;
}

export async function deleteTask(db: Db, taskId: number): Promise<void> {
  if (!(await taskRepo.deleteTask(db, taskId))) {
    throw notFound('Task not found');
  }
}

export async function moveTask(
  db: Db,
  taskId: number,
  columnId: number,
): Promise<TaskRow> {
  const task = await taskRepo.getTaskById(db, taskId);
  if (!task) {
    throw notFound('Task not found');
  }

  const target = await requireColumn(db, columnId);
  const current = await requireColumn(db, task.columnId);
  if (target.boardId !== current.boardId) {
    throw badRequest('Task can only be moved to a column on the same board');
  }

  const moved = await taskRepo.moveTask(db, taskId, columnId);
  if (!moved) {
    throw new Error('Failed to move task');
  }
  return moved;
}