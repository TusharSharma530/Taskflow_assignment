import type { Request, Response } from 'express';
import * as boardService from '../services/board.service';
import { parsePositiveIntegerId } from '../utils/params';
import { asyncHandler } from '../utils/async-handler';
import type { Db } from '../db/database';

export function listBoardsController(db: Db) {
  return asyncHandler(async (_req: Request, res: Response) => {
    res.json(await boardService.listBoards(db));
  });
}

export function getBoardController(db: Db) {
  return asyncHandler(async (req: Request, res: Response) => {
    const boardId = parsePositiveIntegerId(req.params.boardId, 'boardId');
    res.json(await boardService.getBoard(db, boardId));
  });
}

export function getColumnCountsController(db: Db) {
  return asyncHandler(async (req: Request, res: Response) => {
    const boardId = parsePositiveIntegerId(req.params.boardId, 'boardId');
    res.json(await boardService.getColumnCounts(db, boardId));
  });
}