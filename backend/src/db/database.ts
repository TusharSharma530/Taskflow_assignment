import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Database connection + schema initialisation.
 *
 * `createDatabase` opens (or creates) a SQLite file, enables foreign-key
 * enforcement and applies the schema. Passing ':memory:' returns an
 * isolated in-memory database, which tests rely on.
 */

const SCHEMA_PATH = resolveSchemaPath();

function resolveSchemaPath(): string {
  const fromHere = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const candidates = [
    path.resolve(fromHere, '../../../database/schema.sql'),
    path.resolve(process.cwd(), '../database/schema.sql'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

export function initDatabase(db: Database.Database): void {
  db.pragma('foreign_keys = ON');
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
}

export function createDatabase(dbPath: string): Database.Database {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  if (dbPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  initDatabase(db);
  return db;
}