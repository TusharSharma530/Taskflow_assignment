import { describe, it, expect, beforeEach } from 'vitest';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { Db } from '../src/db/database';
import { createTestDb } from './helpers';
import { seedDatabase } from '../src/seed-data';
import {
  getTaskCountPerColumn,
  getColumnsByBoard,
  getBoardById,
} from '../src/repositories/board.repository';
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasksByPriority,
  moveTask,
  updateTask,
} from '../src/repositories/task.repository';
import { toMySqlDateTime } from '../src/utils/datetime';

async function countRows(db: Db, table: string, where?: string): Promise<number> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM ${table}${where ? ` WHERE ${where}` : ''}`,
  );
  return Number(rows[0].c);
}

describe('Query 1 — task count per column', () => {
  let db: Db;

  beforeEach(async () => {
    db = await createTestDb();
    await seedDatabase(db);
  });

  it('returns the correct counts for seeded data', async () => {
    const counts = await getTaskCountPerColumn(db, 1);
    const byTitle = Object.fromEntries(
      counts.map((row) => [row.columnTitle, row.taskCount]),
    );

    expect(counts).toHaveLength(3);
    expect(byTitle['To Do']).toBe(4);
    expect(byTitle['In Progress']).toBe(3);
    expect(byTitle['Done']).toBe(4);
  });

  it('includes columns with zero tasks', async () => {
    await db.execute(
      'INSERT INTO columns (board_id, title, position) VALUES (?, ?, ?)',
      [1, 'Backlog', 4],
    );

    const counts = await getTaskCountPerColumn(db, 1);
    const backlog = counts.find((row) => row.columnTitle === 'Backlog');
    expect(backlog).toBeDefined();
    expect(backlog?.taskCount).toBe(0);
  });

  it('orders columns by position', async () => {
    const counts = await getTaskCountPerColumn(db, 1);
    const titles = counts.map((row) => row.columnTitle);
    expect(titles).toEqual(['To Do', 'In Progress', 'Done']);
  });

  it('only counts tasks of the requested board', async () => {
    const [boardResult] = await db.execute<ResultSetHeader>(
      'INSERT INTO boards (title) VALUES (?)',
      ['Other Board'],
    );
    const otherBoardId = boardResult.insertId;
    const [columnResult] = await db.execute<ResultSetHeader>(
      'INSERT INTO columns (board_id, title, position) VALUES (?, ?, ?)',
      [otherBoardId, 'Elsewhere', 1],
    );
    await db.execute('INSERT INTO tasks (column_id, title, priority) VALUES (?, ?, ?)', [
      columnResult.insertId,
      'Foreign task',
      'LOW',
    ]);

    const counts = await getTaskCountPerColumn(db, 1);
    const total = counts.reduce((sum, row) => sum + row.taskCount, 0);
    expect(total).toBe(11);
  });
});

describe('Query 2 — tasks by priority, newest first', () => {
  let db: Db;

  beforeEach(async () => {
    db = await createTestDb();
    await seedDatabase(db);
  });

  it('returns only tasks of the requested priority', async () => {
    const high = await getTasksByPriority(db, 'HIGH');
    expect(high.length).toBeGreaterThan(0);
    for (const task of high) {
      expect(task.priority).toBe('HIGH');
    }
  });

  it('orders results newest first', async () => {
    const columnId = (await getColumnsByBoard(db, 1))[0].id;
    for (const [title, created] of [
      ['Oldest', '2024-01-01T00:00:00.000Z'],
      ['Middle', '2025-06-15T00:00:00.000Z'],
      ['Newest', '2026-08-01T00:00:00.000Z'],
    ] as const) {
      await db.execute(
        `INSERT INTO tasks (column_id, title, description, priority, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [columnId, title, null, 'MEDIUM', toMySqlDateTime(created)],
      );
    }

    const tasks = await getTasksByPriority(db, 'MEDIUM');
    expect(tasks.map((task) => task.title)).toContain('Oldest');
    expect(tasks.map((task) => task.title)).toContain('Middle');
    expect(tasks.map((task) => task.title)).toContain('Newest');

    const newestFirst = [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    expect(tasks.map((task) => task.createdAt)).toEqual(
      newestFirst.map((task) => task.createdAt),
    );
  });
});

describe('task repository CRUD', () => {
  let db: Db;

  beforeEach(async () => {
    db = await createTestDb();
    await seedDatabase(db);
  });

  it('creates a task and returns it', async () => {
    const columnId = (await getColumnsByBoard(db, 1))[0].id;
    const task = await createTask(db, {
      columnId,
      title: 'New task',
      description: 'A description',
      priority: 'HIGH',
    });

    expect(task.id).toBeTypeOf('number');
    expect(task.columnId).toBe(columnId);
    expect(task.title).toBe('New task');
    expect(task.priority).toBe('HIGH');
    expect(task.createdAt).toBeTypeOf('string');
  });

  it('updates a task partially', async () => {
    const task = await createTask(db, {
      columnId: 1,
      title: 'Original',
      description: null,
      priority: 'LOW',
    });

    const updated = await updateTask(db, task.id, { priority: 'HIGH' });
    expect(updated).toMatchObject({ id: task.id, title: 'Original', priority: 'HIGH' });
  });

  it('returns undefined when updating a missing task', async () => {
    expect(await updateTask(db, 9999, { title: 'X' })).toBeUndefined();
  });

  it('deletes a task', async () => {
    const task = await createTask(db, {
      columnId: 1,
      title: 'Doomed',
      description: null,
      priority: 'LOW',
    });
    expect(await deleteTask(db, task.id)).toBe(true);
    expect(await getTaskById(db, task.id)).toBeUndefined();
    expect(await deleteTask(db, task.id)).toBe(false);
  });

  it('moves a task and returns the updated row', async () => {
    const task = await createTask(db, {
      columnId: 1,
      title: 'Moving',
      description: null,
      priority: 'LOW',
    });
    const moved = await moveTask(db, task.id, 2);
    expect(moved?.columnId).toBe(2);
  });
});

describe('database integrity', () => {
  let db: Db;

  beforeEach(async () => {
    db = await createTestDb();
    await seedDatabase(db);
  });

  it('enforces the priority CHECK constraint', async () => {
    await expect(
      db.execute('INSERT INTO tasks (column_id, title, priority) VALUES (?, ?, ?)', [
        1,
        'Bad',
        'URGENT',
      ]),
    ).rejects.toThrow();
  });

  it('enforces the tasks.column_id foreign key', async () => {
    await expect(
      db.execute('INSERT INTO tasks (column_id, title) VALUES (?, ?)', [9999, 'Orphan']),
    ).rejects.toThrow();
  });

  it('enforces the columns.board_id foreign key', async () => {
    await expect(
      db.execute('INSERT INTO columns (board_id, title) VALUES (?, ?)', [9999, 'Orphan']),
    ).rejects.toThrow();
  });

  it('cascades: deleting a column deletes its tasks', async () => {
    const columnId = (await getColumnsByBoard(db, 1))[0].id;
    await db.execute('DELETE FROM columns WHERE id = ?', [columnId]);

    expect(await countRows(db, 'tasks', `column_id = ${columnId}`)).toBe(0);
  });

  it('cascades: deleting a board deletes its columns and tasks', async () => {
    await db.execute('DELETE FROM boards WHERE id = ?', [1]);

    expect(await getBoardById(db, 1)).toBeUndefined();
    expect(await getColumnsByBoard(db, 1)).toHaveLength(0);
    expect(await countRows(db, 'tasks')).toBe(0);
  });

  it('foreign keys are enabled (InnoDB)', async () => {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT @@SESSION.foreign_key_checks AS FK_ENFORCED',
    );
    expect(Number(rows[0].FK_ENFORCED)).toBe(1);
  });
});