import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { Db } from '../db/database';
import { normalizeRows, type SqlRow } from './row-mapper';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskRow {
  id: number;
  columnId: number;
  title: string;
  description: string | null;
  priority: Priority;
  createdAt: string;
}

export interface CreateTaskInput {
  columnId: number;
  title: string;
  description: string | null;
  priority: Priority;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: Priority;
}

/**
 * Query 2 — tasks by priority, newest first (required by the assignment).
 */
export async function getTasksByPriority(
  db: Db,
  priority: Priority,
): Promise<TaskRow[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
       id,
       title,
       description,
       priority,
       created_at AS createdAt,
       column_id   AS columnId
     FROM tasks
     WHERE priority = ?
     ORDER BY created_at DESC, id DESC`,
    [priority],
  );
  return normalizeRows(rows as Array<TaskRow & SqlRow>) as TaskRow[];
}

export interface TaskListItem {
  id: number;
  title: string;
  description: string | null;
  priority: Priority;
  createdAt: string;
  columnId: number;
  columnTitle: string;
  boardId: number;
}

/**
 * Returns every task in the database joined with its column, newest first.
 * Used by the "All Tasks" listing.
 */
export async function listTasks(db: Db): Promise<TaskListItem[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
       t.id,
       t.title,
       t.description,
       t.priority,
       t.created_at AS createdAt,
       c.id         AS columnId,
       c.title      AS columnTitle,
       c.board_id   AS boardId
     FROM tasks t
     JOIN columns c ON c.id = t.column_id
     ORDER BY t.created_at DESC, t.id DESC`,
  );
  return normalizeRows(rows as Array<TaskListItem & SqlRow>) as TaskListItem[];
}

export async function getTaskById(
  db: Db,
  taskId: number,
): Promise<TaskRow | undefined> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
       id,
       title,
       description,
       priority,
       created_at AS createdAt,
       column_id   AS columnId
     FROM tasks
     WHERE id = ?`,
    [taskId],
  );
  const normalized = normalizeRows(rows as Array<TaskRow & SqlRow>);
  return normalized[0] as TaskRow | undefined;
}

export async function createTask(
  db: Db,
  input: CreateTaskInput,
): Promise<TaskRow> {
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO tasks (column_id, title, description, priority)
     VALUES (?, ?, ?, ?)`,
    [input.columnId, input.title, input.description, input.priority],
  );

  const created = await getTaskById(db, result.insertId);
  if (!created) {
    throw new Error('Failed to load the task after creation');
  }
  return created;
}

export async function updateTask(
  db: Db,
  taskId: number,
  input: UpdateTaskInput,
): Promise<TaskRow | undefined> {
  const existing = await getTaskById(db, taskId);
  if (!existing) {
    return undefined;
  }

  await db.execute<ResultSetHeader>(
    `UPDATE tasks
     SET title = ?, description = ?, priority = ?
     WHERE id = ?`,
    [
      input.title ?? existing.title,
      input.description === undefined ? existing.description : input.description,
      input.priority ?? existing.priority,
      taskId,
    ],
  );

  return getTaskById(db, taskId);
}

export async function deleteTask(db: Db, taskId: number): Promise<boolean> {
  const [result] = await db.execute<ResultSetHeader>(
    'DELETE FROM tasks WHERE id = ?',
    [taskId],
  );
  return result.affectedRows > 0;
}

export async function moveTask(
  db: Db,
  taskId: number,
  columnId: number,
): Promise<TaskRow | undefined> {
  const [result] = await db.execute<ResultSetHeader>(
    'UPDATE tasks SET column_id = ? WHERE id = ?',
    [columnId, taskId],
  );
  if (result.affectedRows === 0) {
    return undefined;
  }
  return getTaskById(db, taskId);
}