import type Database from 'better-sqlite3';

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
export function getTasksByPriority(
  db: Database.Database,
  priority: Priority,
): TaskRow[] {
  return db
    .prepare(
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
    )
    .all(priority) as TaskRow[];
}

export function getTaskById(
  db: Database.Database,
  taskId: number,
): TaskRow | undefined {
  return db
    .prepare(
      `SELECT
         id,
         title,
         description,
         priority,
         created_at AS createdAt,
         column_id   AS columnId
       FROM tasks
       WHERE id = ?`,
    )
    .get(taskId) as TaskRow | undefined;
}

export function createTask(
  db: Database.Database,
  input: CreateTaskInput,
): TaskRow {
  const result = db
    .prepare(
      `INSERT INTO tasks (column_id, title, description, priority)
       VALUES (?, ?, ?, ?)`,
    )
    .run(input.columnId, input.title, input.description, input.priority);

  const created = getTaskById(db, Number(result.lastInsertRowid));
  if (!created) {
    throw new Error('Failed to load the task after creation');
  }
  return created;
}

export function updateTask(
  db: Database.Database,
  taskId: number,
  input: UpdateTaskInput,
): TaskRow | undefined {
  const existing = getTaskById(db, taskId);
  if (!existing) {
    return undefined;
  }

  db.prepare(
    `UPDATE tasks
     SET title = ?, description = ?, priority = ?
     WHERE id = ?`,
  ).run(
    input.title ?? existing.title,
    input.description === undefined ? existing.description : input.description,
    input.priority ?? existing.priority,
    taskId,
  );

  return getTaskById(db, taskId);
}

export function deleteTask(
  db: Database.Database,
  taskId: number,
): boolean {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  return result.changes > 0;
}

export function moveTask(
  db: Database.Database,
  taskId: number,
  columnId: number,
): TaskRow | undefined {
  const result = db
    .prepare('UPDATE tasks SET column_id = ? WHERE id = ?')
    .run(columnId, taskId);
  if (result.changes === 0) {
    return undefined;
  }
  return getTaskById(db, taskId);
}