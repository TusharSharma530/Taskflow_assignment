import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
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

describe('Query 1 — task count per column', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
    seedDatabase(db);
  });

  it('returns the correct counts for seeded data', () => {
    const counts = getTaskCountPerColumn(db, 1);
    const byTitle = Object.fromEntries(
      counts.map((row) => [row.columnTitle, row.taskCount]),
    );

    expect(counts).toHaveLength(3);
    expect(byTitle['To Do']).toBe(2);
    expect(byTitle['In Progress']).toBe(1);
    expect(byTitle['Done']).toBe(2);
  });

  it('includes columns with zero tasks', () => {
    db.prepare('INSERT INTO columns (board_id, title, position) VALUES (?, ?, ?)').run(
      1,
      'Backlog',
      4,
    );

    const counts = getTaskCountPerColumn(db, 1);
    const backlog = counts.find((row) => row.columnTitle === 'Backlog');
    expect(backlog).toBeDefined();
    expect(backlog?.taskCount).toBe(0);
  });

  it('orders columns by position', () => {
    const counts = getTaskCountPerColumn(db, 1);
    const titles = counts.map((row) => row.columnTitle);
    expect(titles).toEqual(['To Do', 'In Progress', 'Done']);
  });

  it('only counts tasks of the requested board', () => {
    const otherBoard = db
      .prepare('INSERT INTO boards (title) VALUES (?)')
      .run('Other Board');
    const otherColumn = db
      .prepare('INSERT INTO columns (board_id, title, position) VALUES (?, ?, ?)')
      .run(Number(otherBoard.lastInsertRowid), 'Elsewhere', 1);
    db.prepare('INSERT INTO tasks (column_id, title, priority) VALUES (?, ?, ?)').run(
      Number(otherColumn.lastInsertRowid),
      'Foreign task',
      'LOW',
    );

    const counts = getTaskCountPerColumn(db, 1);
    const total = counts.reduce((sum, row) => sum + row.taskCount, 0);
    expect(total).toBe(5);
  });
});

describe('Query 2 — tasks by priority, newest first', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
    seedDatabase(db);
  });

  it('returns only tasks of the requested priority', () => {
    const high = getTasksByPriority(db, 'HIGH');
    expect(high.length).toBeGreaterThan(0);
    for (const task of high) {
      expect(task.priority).toBe('HIGH');
    }
  });

  it('orders results newest first', () => {
    const columnId = getColumnsByBoard(db, 1)[0].id;
    const insert = db.prepare(
      `INSERT INTO tasks (column_id, title, description, priority, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    );
    insert.run(columnId, 'Oldest', null, 'MEDIUM', '2024-01-01T00:00:00.000Z');
    insert.run(columnId, 'Middle', null, 'MEDIUM', '2025-06-15T00:00:00.000Z');
    insert.run(columnId, 'Newest', null, 'MEDIUM', '2026-08-01T00:00:00.000Z');

    const tasks = getTasksByPriority(db, 'MEDIUM');
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
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
    seedDatabase(db);
  });

  it('creates a task and returns it', () => {
    const columnId = getColumnsByBoard(db, 1)[0].id;
    const task = createTask(db, {
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

  it('updates a task partially', () => {
    const task = createTask(db, {
      columnId: 1,
      title: 'Original',
      description: null,
      priority: 'LOW',
    });

    const updated = updateTask(db, task.id, { priority: 'HIGH' });
    expect(updated).toMatchObject({ id: task.id, title: 'Original', priority: 'HIGH' });
  });

  it('returns undefined when updating a missing task', () => {
    expect(updateTask(db, 9999, { title: 'X' })).toBeUndefined();
  });

  it('deletes a task', () => {
    const task = createTask(db, { columnId: 1, title: 'Doomed', description: null, priority: 'LOW' });
    expect(deleteTask(db, task.id)).toBe(true);
    expect(getTaskById(db, task.id)).toBeUndefined();
    expect(deleteTask(db, task.id)).toBe(false);
  });

  it('moves a task and returns the updated row', () => {
    const task = createTask(db, { columnId: 1, title: 'Moving', description: null, priority: 'LOW' });
    const moved = moveTask(db, task.id, 2);
    expect(moved?.columnId).toBe(2);
  });
});

describe('database integrity', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
    seedDatabase(db);
  });

  it('enforces the priority CHECK constraint', () => {
    expect(() =>
      db
        .prepare('INSERT INTO tasks (column_id, title, priority) VALUES (?, ?, ?)')
        .run(1, 'Bad', 'URGENT'),
    ).toThrow();
  });

  it('enforces the tasks.column_id foreign key', () => {
    expect(() =>
      db.prepare('INSERT INTO tasks (column_id, title) VALUES (?, ?)').run(9999, 'Orphan'),
    ).toThrow();
  });

  it('enforces the columns.board_id foreign key', () => {
    expect(() =>
      db.prepare('INSERT INTO columns (board_id, title) VALUES (?, ?)').run(9999, 'Orphan'),
    ).toThrow();
  });

  it('cascades: deleting a column deletes its tasks', () => {
    const columnId = getColumnsByBoard(db, 1)[0].id;
    db.prepare('DELETE FROM columns WHERE id = ?').run(columnId);

    const orphans = db
      .prepare('SELECT COUNT(*) AS c FROM tasks WHERE column_id = ?')
      .get(columnId) as { c: number };
    expect(orphans.c).toBe(0);
  });

  it('cascades: deleting a board deletes its columns and tasks', () => {
    db.prepare('DELETE FROM boards WHERE id = 1').run();

    expect(getBoardById(db, 1)).toBeUndefined();
    expect(getColumnsByBoard(db, 1)).toHaveLength(0);
    const remaining = db.prepare('SELECT COUNT(*) AS c FROM tasks').get() as { c: number };
    expect(remaining.c).toBe(0);
  });

  it('foreign_keys pragma is enabled', () => {
    const row = db.pragma('foreign_keys', { simple: true });
    expect(row).toBe(1);
  });
});