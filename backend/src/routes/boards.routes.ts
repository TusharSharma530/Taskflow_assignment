import { Router } from 'express';
import type Database from 'better-sqlite3';
import {
  getBoardController,
  getColumnCountsController,
  listBoardsController,
} from '../controllers/boards.controller';

export function boardsRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/boards', listBoardsController(db));
  router.get('/boards/:boardId', getBoardController(db));
  router.get('/boards/:boardId/column-counts', getColumnCountsController(db));

  return router;
}