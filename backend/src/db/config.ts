import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

/**
 * Resolves the repository root directory: the directory that contains both
 * the `backend/` and `frontend/` workspaces. Finding it by walking up
 * avoids depending on `__dirname` (absent in some bundled/ESM contexts)
 * or the process working directory.
 */
export function repoRoot(): string {
  const start =
    typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  let dir = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(dir, 'backend')) &&
      fs.existsSync(path.join(dir, 'frontend'))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return path.resolve(start);
    }
    dir = parent;
  }
}

/**
 * Reads environment configuration. Env vars are resolved as follows:
 *  1. any value currently in `process.env` (e.g. real env vars)
 *  2. the root `.env` file, which is loaded by `config()`
 *  3. sensible defaults
 */
export function config(): void {
  dotenv.config({ path: path.join(repoRoot(), '.env'), quiet: true });
}

export function getPort(): number {
  const parsed = Number(process.env.PORT);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 3000;
}

export interface MySqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
}

function envInt(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Reads MySQL connection settings from the environment. All values have
 * sensible defaults so a fresh checkout with just `DB_PASSWORD` set works.
 */
export function getMySqlConfig(): MySqlConfig {
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: envInt('DB_PORT', 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'taskflow',
    connectionLimit: envInt('DB_CONNECTION_LIMIT', 10),
  };
}

/**
 * MySQL connection settings for the automated test database. Kept separate
 * so tests never touch the development database.
 */
export function getTestMySqlConfig(): MySqlConfig {
  return {
    ...getMySqlConfig(),
    database: process.env.DB_TEST_NAME ?? 'taskflow_test',
  };
}