import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import type { MySqlConfig } from './config';
import { repoRoot } from './config';

/**
 * Database connection + schema initialisation.
 *
 * `createPool` opens a connection pool to the configured MySQL database
 * (creating it first if it does not exist) and applies the schema.
 *
 * `initDatabase` runs the schema file so tests and the server both start
 * from an identical, idempotent schema.
 */

export type Db = mysql.Pool;

const SCHEMA_PATH = path.join(repoRoot(), 'database', 'schema.sql');

/** Connects (without a database selected) to run administrative SQL. */
async function connectAdmin(config: MySqlConfig): Promise<mysql.Pool> {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    connectionLimit: 1,
    multipleStatements: true,
  });
}

export async function ensureDatabase(db: Db, name: string): Promise<void> {
  await db.query(
    `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
}

/** Applies the schema file to the given database connection. */
export async function initDatabase(db: Db): Promise<void> {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await db.query(schema);
}

export async function createPool(config: MySqlConfig): Promise<mysql.Pool> {
  // 1. Create the database if it doesn't exist yet (no DB selected).
  const admin = await connectAdmin(config);
  await admin.query('SELECT 1'); // fail fast if credentials are wrong
  await ensureDatabase(admin, config.database);
  await admin.end();

  // 2. Open a real pool against it and apply the schema idempotently.
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: config.connectionLimit,
    multipleStatements: true,
    timezone: 'Z',
    charset: 'utf8mb4',
    decimalNumbers: true,
  });

  await initDatabase(pool);
  return pool;
}