import type { Express } from 'express';
import { createApp } from '../src/app';
import { createPool, type Db } from '../src/db/database';
import { config, getTestMySqlConfig } from '../src/db/config';
import { seedDatabase } from '../src/seed-data';

// Load .env so DB_PASSWORD etc. reach the MySQL pool during tests.
config();

/**
 * Opens a pool to the dedicated test database (`taskflow_test`) and
 * applies the schema. Each test works against this database, so tests in
 * different files must run sequentially (see vitest.config.ts).
 */
export async function createTestDb(): Promise<Db> {
  return createPool(getTestMySqlConfig());
}

export type SeededResult = Awaited<ReturnType<typeof seedDatabase>>;

/**
 * Returns a seeded test database plus an Express app wired to it.
 * Seeding resets all tables first, so every test starts from the same
 * predictable dataset.
 */
export async function createTestApp(): Promise<{
  db: Db;
  app: Express;
  seeded: SeededResult;
}> {
  const db = await createTestDb();
  const seeded = await seedDatabase(db);
  const app = createApp(db);
  return { db, app, seeded };
}

export { seedDatabase };