import type { RowDataPacket } from 'mysql2';
import type { Db } from '../db/database';
import { normalizeCount, normalizeRows, type SqlRow } from './row-mapper';

export interface BoardRow {
  id: number;
  title: string;
  createdAt: string;
}

export interface ColumnRow {
  id: number;
  boardId: number;
  title: string;
  position: number;
  createdAt: string;
}

export interface TaskCountRow {
  columnId: number;
  columnTitle: string;
  taskCount: number;
}

export interface BoardTaskRow {
  id: number;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  columnId: number;
}

/**
 * Query 1 — task count per column (required by the assignment).
 *
 * Counts the tasks in every column of a board. A LEFT JOIN keeps columns
 * with zero tasks in the result, and ordering follows column position.
 */
export async function getTaskCountPerColumn(
  db: Db,
  boardId: number,
): Promise<TaskCountRow[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
       c.id         AS columnId,
       c.title      AS columnTitle,
       COUNT(t.id)  AS taskCount
     FROM columns c
     LEFT JOIN tasks t ON t.column_id = c.id
     WHERE c.board_id = ?
     GROUP BY c.id, c.title, c.position
     ORDER BY c.position, c.id`,
    [boardId],
  );

  return normalizeRows(
    rows.map((row) => ({ ...row, taskCount: normalizeCount(row.taskCount) })),
  ) as TaskCountRow[];
}

export async function listBoards(db: Db): Promise<BoardRow[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, title, created_at AS createdAt
     FROM boards
     ORDER BY id`,
  );
  return normalizeRows(rows as Array<BoardRow & SqlRow>) as BoardRow[];
}

export async function getBoardById(
  db: Db,
  boardId: number,
): Promise<BoardRow | undefined> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, title, created_at AS createdAt
     FROM boards
     WHERE id = ?`,
    [boardId],
  );
  const normalized = normalizeRows(rows as Array<BoardRow & SqlRow>);
  return normalized[0] as BoardRow | undefined;
}

export async function getColumnsByBoard(
  db: Db,
  boardId: number,
): Promise<ColumnRow[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
       id,
       board_id   AS boardId,
       title,
       position,
       created_at AS createdAt
     FROM columns
     WHERE board_id = ?
     ORDER BY position, id`,
    [boardId],
  );
  return normalizeRows(rows as Array<ColumnRow & SqlRow>) as ColumnRow[];
}

export async function getColumnById(
  db: Db,
  columnId: number,
): Promise<ColumnRow | undefined> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
       id,
       board_id   AS boardId,
       title,
       position,
       created_at AS createdAt
     FROM columns
     WHERE id = ?`,
    [columnId],
  );
  const normalized = normalizeRows(rows as Array<ColumnRow & SqlRow>);
  return normalized[0] as ColumnRow | undefined;
}

/**
 * Returns every task belonging to a board together with the column it
 * lives in, used to assemble the board response.
 */
export async function getTasksByBoard(
  db: Db,
  boardId: number,
): Promise<BoardTaskRow[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
       t.id,
       t.title,
       t.description,
       t.priority,
       t.created_at AS createdAt,
       t.column_id   AS columnId
     FROM tasks t
     JOIN columns c ON c.id = t.column_id
     WHERE c.board_id = ?
     ORDER BY t.id`,
    [boardId],
  );
  return normalizeRows(rows as Array<BoardTaskRow & SqlRow>) as BoardTaskRow[];
}