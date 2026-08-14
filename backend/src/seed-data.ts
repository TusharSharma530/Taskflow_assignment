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
      title: 'Build authentication API',
      description: 'Add sign-up, sign-in and token refresh endpoints.',
      priority: 'HIGH',
      minutesAgo: 2 * 60,
    },
    {
      title: 'Design database schema',
      description: 'Finalize tables, constraints and indexes for the task board.',
      priority: 'MEDIUM',
      minutesAgo: 8 * 60,
    },
    {
      title: 'Write API documentation',
      description: 'Document every endpoint with request and response examples.',
      priority: 'LOW',
      minutesAgo: 2 * 24 * 60,
    },
    {
      title: 'Add due dates',
      description: 'Allow tasks to carry an optional due date.',
      priority: 'MEDIUM',
      minutesAgo: 3 * 24 * 60,
    },
  ],
  'In Progress': [
    {
      title: 'Create REST endpoints',
      description: 'Build the Express routes for tasks and boards.',
      priority: 'HIGH',
      minutesAgo: 50,
    },
    {
      title: 'Build the board UI',
      description: 'Implement columns, task cards and the create/edit flows.',
      priority: 'MEDIUM',
      minutesAgo: 4 * 60,
    },
    {
      title: 'Add search & filtering',
      description: 'Client-side title search plus a priority filter.',
      priority: 'LOW',
      minutesAgo: 9 * 60,
    },
  ],
  Done: [
    {
      title: 'Set up monorepo',
      description: 'Initialize tooling, workspaces and the shared toolchain.',
      priority: 'LOW',
      minutesAgo: 4 * 24 * 60,
    },
    {
      title: 'Write the seed script',
      description: 'Populate a fresh database with realistic demo data.',
      priority: 'MEDIUM',
      minutesAgo: 3 * 24 * 60,
    },
    {
      title: 'Add delete confirmation',
      description: 'Guard destructive actions behind a confirmation dialog.',
      priority: 'MEDIUM',
      minutesAgo: 24 * 60,
    },
    {
      title: 'Wire up persistence tests',
      description: 'Verify CRUD, foreign keys and required queries with Vitest.',
      priority: 'HIGH',
      minutesAgo: 5 * 60,
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