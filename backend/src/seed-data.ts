import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { Priority } from './repositories/task.repository';
import type { Db } from './db/database';
import { toMySqlDateTime } from './utils/datetime';

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
 * replacing any existing data in a single transaction. Used by `npm run
 * seed` and by tests.
 */
export async function seedDatabase(db: Db): Promise<{
  boardId: number;
  tasks: number;
  columns: number;
}> {
  const conn: PoolConnection = await db.getConnection();
  try {
    // TRUNCATE is fastest and resets AUTO_INCREMENT in one step, but MySQL
    // refuses to TRUNCATE a table referenced by a foreign key, so foreign
    // key checks are disabled around the truncates and re-enabled after.
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE tasks');
    await conn.query('TRUNCATE TABLE columns');
    await conn.query('TRUNCATE TABLE boards');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    await conn.beginTransaction();

    const [boardResult] = await conn.execute<ResultSetHeader>(
      'INSERT INTO boards (title) VALUES (?)',
      [SEED_BOARD_TITLE],
    );
    const boardId = Number(boardResult.insertId);

    let tasks = 0;
    for (const column of SEED_COLUMNS) {
      const [columnResult] = await conn.execute<ResultSetHeader>(
        'INSERT INTO columns (board_id, title, position) VALUES (?, ?, ?)',
        [boardId, column.title, column.position],
      );
      const columnId = Number(columnResult.insertId);
      const columnTasks = SEED_TASKS[column.title] ?? [];
      for (const task of columnTasks) {
        await conn.execute(
          `INSERT INTO tasks (column_id, title, description, priority, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [
            columnId,
            task.title,
            task.description,
            task.priority,
            toMySqlDateTime(minutesAgoIso(task.minutesAgo)),
          ],
        );
        tasks += 1;
      }
    }

    await conn.commit();
    return { boardId, tasks, columns: SEED_COLUMNS.length };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Seeds the demo board only when the database contains no boards yet, so a
 * freshly initialised database is never completely empty. Used by the
 * server on startup.
 */
export async function seedIfEmpty(db: Db): Promise<boolean> {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS count FROM boards',
  );
  if (Number(rows[0]?.count) > 0) {
    return false;
  }
  await seedDatabase(db);
  return true;
}