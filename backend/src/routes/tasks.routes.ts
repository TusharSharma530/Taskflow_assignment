import { Router } from 'express';
import {
  createTaskController,
  deleteTaskController,
  getTaskController,
  listTasksController,
  moveTaskController,
  updateTaskController,
} from '../controllers/tasks.controller';
import type { Db } from '../db/database';

export function tasksRouter(db: Db): Router {
  const router = Router();

  router.get('/tasks', listTasksController(db));
  router.post('/tasks', createTaskController(db));
  router.get('/tasks/:taskId', getTaskController(db));
  router.put('/tasks/:taskId', updateTaskController(db));
  router.delete('/tasks/:taskId', deleteTaskController(db));
  router.patch('/tasks/:taskId/move', moveTaskController(db));

  return router;
}