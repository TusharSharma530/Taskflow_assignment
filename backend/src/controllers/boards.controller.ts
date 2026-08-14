import type { Request, Response } from 'express';
import { getBoard, getColumnCounts, listBoards } from '../services/board.service';
import { parsePositiveIntegerId } from '../utils/params';
import type Database from 'better-sqlite3';

export function listBoardsController(db: Database.Database) {
  return (_req: Request, res: Response): void => {
    res.json(listBoards(db));
  };
}

export function getBoardController(db: Database.Database) {
  return (req: Request, res: Response): void => {
    const boardId = parsePositiveIntegerId(req.params.boardId, 'boardId');
    res.json(getBoard(db, boardId));
  };
}

export function getColumnCountsController(db: Database.Database) {
  return (req: Request, res: Response): void => {
    const boardId = parsePositiveIntegerId(req.params.boardId, 'boardId');
    res.json(getColumnCounts(db, boardId));
  };
}