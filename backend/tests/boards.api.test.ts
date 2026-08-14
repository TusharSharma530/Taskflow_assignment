import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createTestApp } from './helpers';

describe('GET /api/boards', () => {
  it('lists boards', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/boards');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ id: 1, title: 'TaskFlow Demo Board' });
  });
});

describe('GET /api/boards/:boardId', () => {
  it('returns the board with columns and tasks', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/boards/1');

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('TaskFlow Demo Board');
    expect(response.body.columns).toHaveLength(3);

    const columnTitles = response.body.columns.map(
      (column: { title: string }) => column.title,
    );
    expect(columnTitles).toEqual(['To Do', 'In Progress', 'Done']);

    const toDo = response.body.columns[0];
    expect(toDo.tasks.length).toBeGreaterThan(0);
    expect(toDo.tasks[0]).toMatchObject({
      id: expect.any(Number),
      title: expect.any(String),
      priority: expect.any(String),
      columnId: toDo.id,
    });
  });

  it('returns 404 for a nonexistent board', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/boards/9999');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Board not found' });
  });

  it('returns 400 for a non-numeric board id', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/boards/abc');
    expect(response.status).toBe(400);
  });
});

describe('GET /api/boards/:boardId/column-counts', () => {
  it('returns the task count per column (Query 1)', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/boards/1/column-counts');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
    const byTitle = Object.fromEntries(
      response.body.map((row: { columnTitle: string; taskCount: number }) => [
        row.columnTitle,
        row.taskCount,
      ]),
    );
    expect(byTitle['To Do']).toBe(4);
    expect(byTitle['In Progress']).toBe(3);
    expect(byTitle['Done']).toBe(4);
  });
});