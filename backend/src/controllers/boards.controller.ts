import type { Request, Response } from 'express';
import { badRequest } from '../errors/http.error';
import { getBoard, getColumnCounts, listBoards } from '../services/board.service';
import type Database from 'better-sqlite3';

export function parseId(raw: unknown, field: string): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }
  return value;
}

export function listBoardsController(db: Database.Database) {
  return (_req: Request, res: Response): void => {
    res.json(listBoards(db));
  };
}

export function getBoardController(db: Database.Database) {
  return (req: Request, res: Response): void => {
    const boardId = parseId(req.params.boardId, 'boardId');
    res.json(getBoard(db, boardId));
  };
}

export function getColumnCountsController(db: Database.Database) {
  return (req: Request, res: Response): void => {
    const boardId = parseId(req.params.boardId, 'boardId');
    res.json(getColumnCounts(db, boardId));
  };
}