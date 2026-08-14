import type Database from 'better-sqlite3';
import type { Priority } from './repositories/task.repository';

interface SeedTask {
  title: string;
  description: string | null;
  priority: Priority;
  minutesAgo: number;
}

export const SEED_BOARD_TITLE = 'TaskFlow Demo Board';

const SEED_COLUMNS: Array<{ title: string; position: number }> = [
  { title: 'To Do', position: 1 },
  { title: 'In Progress', position: 2 },
  { title: 'Done', position: 3 },
];

const SEED_TASKS: Record<string, SeedTask[]> = {
  'To Do': [
    {
      title: 'Build task board',
      description: 'Assemble the React + TypeScript board UI and connect it to the API.',
      priority: 'MEDIUM',
      minutesAgo: 4 * 60,
    },
    {
      title: 'Write tests',
      description: 'Cover the API with automated tests using Vitest and Supertest.',
      priority: 'HIGH',
      minutesAgo: 2 * 60,
    },
  ],
  'In Progress': [
    {
      title: 'Create API',
      description: 'Build the Express REST API with validation and error handling.',
      priority: 'HIGH',
      minutesAgo: 6 * 60,
    },
  ],
  Done: [
    {
      title: 'Set up project',
      description: 'Initialize the monorepo, tooling and database schema.',
      priority: 'LOW',
      minutesAgo: 3 * 24 * 60,
    },
    {
      title: 'Deploy application',
      description: 'Deploy the backend and frontend to a hosting provider.',
      priority: 'MEDIUM',
      minutesAgo: 24 * 60,
    },
  ],
};

function minutesAgoIso(minutes: number): string {
  const date = new Date(Date.now() - minutes * 60_000);
  return date.toISOString();
}

/**
 * Inserts the demo board, columns and tasks into the given database,
 * replacing any existing data. Used by `npm run seed` and by tests.
 */
export function seedDatabase(db: Database.Database): {
  boardId: number;
  tasks: number;
  columns: number;
} {
  const seed = db.transaction(() => {
    db.exec('DELETE FROM tasks; DELETE FROM columns; DELETE FROM boards;');
    // Reset AUTOINCREMENT counters so a reseeded demo board always gets id 1.
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('boards', 'columns', 'tasks')");

    const boardResult = db
      .prepare('INSERT INTO boards (title) VALUES (?)')
      .run(SEED_BOARD_TITLE);
    const boardId = Number(boardResult.lastInsertRowid);

    const insertColumn = db.prepare(
      'INSERT INTO columns (board_id, title, position) VALUES (?, ?, ?)',
    );
    const insertTask = db.prepare(
      `INSERT INTO tasks (column_id, title, description, priority, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    );

    let tasks = 0;
    for (const column of SEED_COLUMNS) {
      const columnResult = insertColumn.run(boardId, column.title, column.position);
      const columnId = Number(columnResult.lastInsertRowid);
      const columnTasks = SEED_TASKS[column.title] ?? [];
      for (const task of columnTasks) {
        insertTask.run(
          columnId,
          task.title,
          task.description,
          task.priority,
          minutesAgoIso(task.minutesAgo),
        );
        tasks += 1;
      }
    }

    return { boardId, tasks, columns: SEED_COLUMNS.length };
  });

  return seed();
}

/**
 * Seeds the demo board only when the database contains no boards yet, so a
 * freshly initialised database is never completely empty. Used by the
 * server on startup.
 */
export function seedIfEmpty(db: Database.Database): boolean {
  const row = db.prepare('SELECT COUNT(*) AS count FROM boards').get() as { count: number };
  if (row.count > 0) {
    return false;
  }
  seedDatabase(db);
  return true;
}