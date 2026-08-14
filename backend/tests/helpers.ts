import Database from 'better-sqlite3';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { initDatabase } from '../src/db/database';
import { seedDatabase } from '../src/seed-data';

/**
 * Creates an isolated in-memory database with the schema applied.
 * A fresh instance is used per test so tests never share state.
 */
export function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  initDatabase(db);
  return db;
}

/**
 * Returns a seeded test database plus an Express app wired to it.
 */
export function createTestApp(): {
  db: Database.Database;
  app: Express;
  seeded: ReturnType<typeof seedDatabase>;
} {
  const db = createTestDb();
  const seeded = seedDatabase(db);
  const app = createApp(db);
  return { db, app, seeded };
}

export { seedDatabase };