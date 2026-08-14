import type { Request, Response } from 'express';
import * as taskService from '../services/task.service';
import {
  validateCreateTask,
  validateMove,
  validateUpdateTask,
} from '../validation/task.validation';
import { parsePositiveIntegerId } from '../utils/params';
import { asyncHandler } from '../utils/async-handler';
import type { Db } from '../db/database';

export function listTasksController(db: Db) {
  return asyncHandler(async (_req: Request, res: Response) => {
    res.json(await taskService.listTasks(db));
  });
}

export function getTaskController(db: Db) {
  return asyncHandler(async (req: Request, res: Response) => {
    const taskId = parsePositiveIntegerId(req.params.taskId, 'taskId');
    res.json(await taskService.getTask(db, taskId));
  });
}

export function createTaskController(db: Db) {
  return asyncHandler(async (req: Request, res: Response) => {
    const result = validateCreateTask(req.body);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    const task = await taskService.createTask(db, result.value);
    res.status(201).json(task);
  });
}

export function updateTaskController(db: Db) {
  return asyncHandler(async (req: Request, res: Response) => {
    const taskId = parsePositiveIntegerId(req.params.taskId, 'taskId');
    const result = validateUpdateTask(req.body);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    const task = await taskService.updateTask(db, taskId, result.value);
    res.json(task);
  });
}

export function deleteTaskController(db: Db) {
  return asyncHandler(async (req: Request, res: Response) => {
    const taskId = parsePositiveIntegerId(req.params.taskId, 'taskId');
    await taskService.deleteTask(db, taskId);
    res.json({ message: 'Task deleted' });
  });
}

export function moveTaskController(db: Db) {
  return asyncHandler(async (req: Request, res: Response) => {
    const taskId = parsePositiveIntegerId(req.params.taskId, 'taskId');
    const result = validateMove(req.body);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    const task = await taskService.moveTask(db, taskId, result.value);
    res.json(task);
  });
}