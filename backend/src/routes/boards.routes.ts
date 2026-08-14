import { Router } from 'express';
import {
  getBoardController,
  getColumnCountsController,
  listBoardsController,
} from '../controllers/boards.controller';
import type { Db } from '../db/database';

export function boardsRouter(db: Db): Router {
  const router = Router();

  router.get('/boards', listBoardsController(db));
  router.get('/boards/:boardId', getBoardController(db));
  router.get('/boards/:boardId/column-counts', getColumnCountsController(db));

  return router;
}