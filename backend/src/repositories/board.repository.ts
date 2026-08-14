import type Database from 'better-sqlite3';

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
export function getTaskCountPerColumn(
  db: Database.Database,
  boardId: number,
): TaskCountRow[] {
  const rows = db
    .prepare(
      `SELECT
         c.id         AS columnId,
         c.title      AS columnTitle,
         COUNT(t.id)  AS taskCount
       FROM columns c
       LEFT JOIN tasks t ON t.column_id = c.id
       WHERE c.board_id = ?
       GROUP BY c.id, c.title, c.position
       ORDER BY c.position, c.id`,
    )
    .all(boardId) as Array<Omit<TaskCountRow, 'taskCount'> & { taskCount: number }>;

  return rows;
}

export function listBoards(db: Database.Database): BoardRow[] {
  return db
    .prepare(
      `SELECT id, title, created_at AS createdAt
       FROM boards
       ORDER BY id`,
    )
    .all() as BoardRow[];
}

export function getBoardById(
  db: Database.Database,
  boardId: number,
): BoardRow | undefined {
  return db
    .prepare(
      `SELECT id, title, created_at AS createdAt
       FROM boards
       WHERE id = ?`,
    )
    .get(boardId) as BoardRow | undefined;
}

export function getColumnsByBoard(
  db: Database.Database,
  boardId: number,
): ColumnRow[] {
  return db
    .prepare(
      `SELECT
         id,
         board_id   AS boardId,
         title,
         position,
         created_at AS createdAt
       FROM columns
       WHERE board_id = ?
       ORDER BY position, id`,
    )
    .all(boardId) as ColumnRow[];
}

export function getColumnById(
  db: Database.Database,
  columnId: number,
): ColumnRow | undefined {
  return db
    .prepare(
      `SELECT
         id,
         board_id   AS boardId,
         title,
         position,
         created_at AS createdAt
       FROM columns
       WHERE id = ?`,
    )
    .get(columnId) as ColumnRow | undefined;
}

/**
 * Returns every task belonging to a board together with the column it
 * lives in, used to assemble the board response.
 */
export function getTasksByBoard(
  db: Database.Database,
  boardId: number,
): BoardTaskRow[] {
  const rows = db
    .prepare(
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
    )
    .all(boardId) as Array<Pick<BoardTaskRow, 'id' | 'title' | 'description' | 'priority' | 'createdAt' | 'columnId'>>;

  return rows;
}