import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp } from './helpers';
import type { Express } from 'express';
import { getColumnsByBoard } from '../src/repositories/board.repository';

describe('GET /api/tasks', () => {
  it('lists all tasks with their column status', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);

    const toDoTask = response.body.find(
      (task: { columnTitle: string }) => task.columnTitle === 'To Do',
    );
    expect(toDoTask).toMatchObject({
      id: expect.any(Number),
      title: expect.any(String),
      priority: expect.any(String),
      columnId: expect.any(Number),
      boardId: 1,
    });
  });

  it('is ordered newest first', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/tasks');

    const dates = response.body.map(
      (task: { createdAt: string }) => task.createdAt,
    );
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
  });
});

describe('POST /api/tasks', () => {
  let ctx: ReturnType<typeof createTestApp>;
  let app: Express;

  beforeEach(() => {
    ctx = createTestApp();
    app = ctx.app;
  });

  it('creates a task with a validated body (201)', async () => {
    const columns = getColumnsByBoard(ctx.db, 1);
    const response = await request(app)
      .post('/api/tasks')
      .send({ columnId: columns[0].id, title: 'Create API', description: 'Build the REST API', priority: 'HIGH' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      columnId: columns[0].id,
      title: 'Create API',
      description: 'Build the REST API',
      priority: 'HIGH',
    });
    expect(response.body.id).toBeTypeOf('number');
    expect(response.body.createdAt).toBeTypeOf('string');
  });

  it('defaults priority to MEDIUM when omitted', async () => {
    const columns = getColumnsByBoard(ctx.db, 1);
    const response = await request(app)
      .post('/api/tasks')
      .send({ columnId: columns[0].id, title: 'No priority' });

    expect(response.status).toBe(201);
    expect(response.body.priority).toBe('MEDIUM');
  });

  it('rejects an empty title with 400 and does not create a task', async () => {
    const before = (ctx.db.prepare('SELECT COUNT(*) AS c FROM tasks').get() as { c: number }).c;
    const response = await request(app)
      .post('/api/tasks')
      .send({ columnId: 1, title: '   ', priority: 'HIGH' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Task title is required' });
    const after = (ctx.db.prepare('SELECT COUNT(*) AS c FROM tasks').get() as { c: number }).c;
    expect(after).toBe(before);
  });

  it('rejects a missing title with 400', async () => {
    const response = await request(app).post('/api/tasks').send({ columnId: 1 });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Task title is required');
  });

  it('rejects an invalid priority with 400', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ columnId: 1, title: 'X', priority: 'URGENT' });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Priority/i);
  });

  it('rejects a nonexistent column with 400', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ columnId: 9999, title: 'X', priority: 'LOW' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Column does not exist');
  });

  it('rejects an invalid columnId type with 400', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ columnId: 'abc', title: 'X' });
    expect(response.status).toBe(400);
  });

  it('rejects an overly long title with 400', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ columnId: 1, title: 'x'.repeat(121) });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/120 characters/);
  });
});

describe('GET /api/tasks/:taskId', () => {
  let ctx: ReturnType<typeof createTestApp>;
  let app: Express;

  beforeEach(() => {
    ctx = createTestApp();
    app = ctx.app;
  });

  it('returns a single task', async () => {
    const response = await request(app).get('/api/tasks/1');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 1,
      title: expect.any(String),
      priority: expect.any(String),
      columnId: expect.any(Number),
      createdAt: expect.any(String),
    });
  });

  it('returns 404 for a nonexistent task', async () => {
    const response = await request(app).get('/api/tasks/9999');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });
});

describe('PUT /api/tasks/:taskId', () => {
  let ctx: ReturnType<typeof createTestApp>;
  let app: Express;

  beforeEach(() => {
    ctx = createTestApp();
    app = ctx.app;
  });

  it('updates title, description and priority', async () => {
    const response = await request(app)
      .put('/api/tasks/1')
      .send({ title: 'Updated title', description: 'Updated description', priority: 'LOW' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 1,
      title: 'Updated title',
      description: 'Updated description',
      priority: 'LOW',
    });
  });

  it('changes only the fields that were provided', async () => {
    const original = await request(app).get('/api/boards/1');
    const task = original.body.columns[0].tasks[0];

    const response = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ priority: 'HIGH' });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe(task.title);
    expect(response.body.priority).toBe('HIGH');
  });

  it('preserves the description when it is not part of the update', async () => {
    const original = await request(app).get('/api/tasks/1');
    expect(original.body.description).not.toBeNull();

    const response = await request(app).put('/api/tasks/1').send({ priority: 'LOW' });
    expect(response.status).toBe(200);
    expect(response.body.description).toBe(original.body.description);
  });

  it('rejects an overly long title with 400', async () => {
    const response = await request(app)
      .put('/api/tasks/1')
      .send({ title: 'x'.repeat(121) });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/120 characters/);
  });

  it('rejects an overly long description with 400', async () => {
    const response = await request(app)
      .put('/api/tasks/1')
      .send({ description: 'x'.repeat(501) });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/500 characters/);
  });

  it('rejects an empty title with 400', async () => {
    const response = await request(app)
      .put('/api/tasks/1')
      .send({ title: '   ' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Task title is required');
  });

  it('rejects an invalid priority with 400', async () => {
    const response = await request(app)
      .put('/api/tasks/1')
      .send({ priority: 'NOPE' });
    expect(response.status).toBe(400);
  });

  it('returns 404 for a nonexistent task', async () => {
    const response = await request(app)
      .put('/api/tasks/9999')
      .send({ title: 'Anything' });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });
});

describe('DELETE /api/tasks/:taskId', () => {
  let ctx: ReturnType<typeof createTestApp>;
  let app: Express;

  beforeEach(() => {
    ctx = createTestApp();
    app = ctx.app;
  });

  it('deletes an existing task', async () => {
    const response = await request(app).delete('/api/tasks/1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Task deleted' });

    const exists = ctx.db.prepare('SELECT id FROM tasks WHERE id = 1').get();
    expect(exists).toBeUndefined();
  });

  it('returns 404 for a nonexistent task', async () => {
    const response = await request(app).delete('/api/tasks/9999');
    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/tasks/:taskId/move', () => {
  let ctx: ReturnType<typeof createTestApp>;
  let app: Express;

  beforeEach(() => {
    ctx = createTestApp();
    app = ctx.app;
  });

  it('moves a task between columns and persists the new column_id', async () => {
    const columns = getColumnsByBoard(ctx.db, 1);
    const fromColumn = columns[0]; // To Do
    const toColumn = columns[1]; // In Progress

    const seededTask = ctx.db
      .prepare('SELECT id, column_id AS columnId FROM tasks WHERE column_id = ?')
      .get(fromColumn.id) as { id: number; columnId: number };
    expect(seededTask.columnId).toBe(fromColumn.id);

    const response = await request(app)
      .patch(`/api/tasks/${seededTask.id}/move`)
      .send({ columnId: toColumn.id });

    expect(response.status).toBe(200);
    expect(response.body.columnId).toBe(toColumn.id);

    const stored = ctx.db
      .prepare('SELECT column_id AS columnId FROM tasks WHERE id = ?')
      .get(seededTask.id) as { columnId: number };
    expect(stored.columnId).toBe(toColumn.id);
  });

  it('returns 404 for a nonexistent task', async () => {
    const response = await request(app)
      .patch('/api/tasks/9999/move')
      .send({ columnId: 2 });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  it('returns 400 for a nonexistent column', async () => {
    const response = await request(app)
      .patch('/api/tasks/1/move')
      .send({ columnId: 9999 });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Column does not exist');
  });

  it('returns 400 when moving to a column on another board', async () => {
    const otherBoard = ctx.db
      .prepare('INSERT INTO boards (title) VALUES (?)')
      .run('Another Board');
    const otherColumn = ctx.db
      .prepare('INSERT INTO columns (board_id, title, position) VALUES (?, ?, ?)')
      .run(Number(otherBoard.lastInsertRowid), 'Elsewhere', 1);

    const response = await request(app)
      .patch('/api/tasks/1/move')
      .send({ columnId: Number(otherColumn.lastInsertRowid) });
    expect(response.status).toBe(400);
  });
});

describe('error handling', () => {
  it('returns a consistent JSON error shape (404)', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/boards/9999');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Board not found' });
  });

  it('returns 404 JSON for unknown API routes', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/nope');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
  });

  it('returns 400 for malformed JSON', async () => {
    const { app } = createTestApp();
    const response = await request(app)
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send('{not json');
    expect(response.status).toBe(400);
  });
});
