import { badRequest, notFound } from '../errors/http.error';
import type { ColumnRow, TaskCountRow, BoardRow, BoardTaskRow } from '../repositories/board.repository';
import * as boardRepo from '../repositories/board.repository';
import type { Db } from '../db/database';

export interface BoardColumn extends ColumnRow {
  tasks: BoardTaskRow[];
}

export interface BoardResponse extends BoardRow {
  columns: BoardColumn[];
}

export async function listBoards(db: Db): Promise<BoardRow[]> {
  return boardRepo.listBoards(db);
}

export async function getBoard(db: Db, boardId: number): Promise<BoardResponse> {
  const board = await boardRepo.getBoardById(db, boardId);
  if (!board) {
    throw notFound('Board not found');
  }

  const columns = await boardRepo.getColumnsByBoard(db, boardId);
  const tasks = await boardRepo.getTasksByBoard(db, boardId);

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

export async function getColumnCounts(
  db: Db,
  boardId: number,
): Promise<TaskCountRow[]> {
  if (!(await boardRepo.getBoardById(db, boardId))) {
    throw notFound('Board not found');
  }
  return boardRepo.getTaskCountPerColumn(db, boardId);
}

export async function requireColumn(db: Db, columnId: number): Promise<ColumnRow> {
  const column = await boardRepo.getColumnById(db, columnId);
  if (!column) {
    throw badRequest('Column does not exist');
  }
  return column;
}