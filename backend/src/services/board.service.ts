import type Database from 'better-sqlite3';
import { badRequest, notFound } from '../errors/http.error';
import type { ColumnRow, TaskCountRow, BoardRow, BoardTaskRow } from '../repositories/board.repository';
import * as boardRepo from '../repositories/board.repository';

export interface BoardColumn extends ColumnRow {
  tasks: BoardTaskRow[];
}

export interface BoardResponse extends BoardRow {
  columns: BoardColumn[];
}

export function listBoards(db: Database.Database): BoardRow[] {
  return boardRepo.listBoards(db);
}

export function getBoard(db: Database.Database, boardId: number): BoardResponse {
  const board = boardRepo.getBoardById(db, boardId);
  if (!board) {
    throw notFound('Board not found');
  }

  const columns = boardRepo.getColumnsByBoard(db, boardId);
  const tasks = boardRepo.getTasksByBoard(db, boardId);

  const tasksByColumn = new Map<number, BoardTaskRow[]>();
  for (const task of tasks) {
    const list = tasksByColumn.get(task.columnId) ?? [];
    list.push(task);
    tasksByColumn.set(task.columnId, list);
  }

  return {
    ...board,
    columns: columns.map((column) => ({
      ...column,
      tasks: tasksByColumn.get(column.id) ?? [],
    })),
  };
}

export function getColumnCounts(
  db: Database.Database,
  boardId: number,
): TaskCountRow[] {
  if (!boardRepo.getBoardById(db, boardId)) {
    throw notFound('Board not found');
  }
  return boardRepo.getTaskCountPerColumn(db, boardId);
}

export function requireColumn(
  db: Database.Database,
  columnId: number,
): ColumnRow {
  const column = boardRepo.getColumnById(db, columnId);
  if (!column) {
    throw badRequest('Column does not exist');
  }
  return column;
}