import type { Request, Response } from 'express';
import type Database from 'better-sqlite3';
import * as taskService from '../services/task.service';
import {
  validateCreateTask,
  validateMove,
  validateUpdateTask,
} from '../validation/task.validation';
import { parsePositiveIntegerId } from '../utils/params';

export function listTasksController(db: Database.Database) {
  return (_req: Request, res: Response): void => {
    res.json(taskService.listTasks(db));
  };
}

export function getTaskController(db: Database.Database) {
  return (req: Request, res: Response): void => {
    const taskId = parsePositiveIntegerId(req.params.taskId, 'taskId');
    res.json(taskService.getTask(db, taskId));
  };
}

export function createTaskController(db: Database.Database) {
  return (req: Request, res: Response): void => {
    const result = validateCreateTask(req.body);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    const task = taskService.createTask(db, result.value);

    res.status(201).json(task);
  };
}

export function updateTaskController(db: Database.Database) {
  return (req: Request, res: Response): void => {
    const taskId = parsePositiveIntegerId(req.params.taskId, 'taskId');
    const result = validateUpdateTask(req.body);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    const task = taskService.updateTask(db, taskId, result.value);
    res.json(task);
  };
}

export function deleteTaskController(db: Database.Database) {
  return (req: Request, res: Response): void => {
    const taskId = parsePositiveIntegerId(req.params.taskId, 'taskId');
    taskService.deleteTask(db, taskId);
    res.json({ message: 'Task deleted' });
  };
}

export function moveTaskController(db: Database.Database) {
  return (req: Request, res: Response): void => {
    const taskId = parsePositiveIntegerId(req.params.taskId, 'taskId');
    const result = validateMove(req.body);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    const task = taskService.moveTask(db, taskId, result.value);
    res.json(task);
  };
}