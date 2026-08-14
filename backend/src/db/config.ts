import path from 'node:path';
import dotenv from 'dotenv';

/**
 * Resolves the repository root directory. When the backend runs from
 * `backend/` (e.g. via npm workspaces) this is the parent of that folder.
 * When built and run from `backend/dist/` it still resolves correctly by
 * walking up from this compiled file's location.
 */
export function repoRoot(): string {
  const fromHere = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  return path.resolve(fromHere, '..', '..');
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

export function getDatabasePath(): string {
  const raw = process.env.DATABASE_PATH ?? './database/taskflow.db';
  if (raw === ':memory:') {
    return raw;
  }
  // Resolve relative paths against the repository root so the value in
  // .env (e.g. ./database/taskflow.db) is stable regardless of cwd.
  return path.resolve(repoRoot(), raw);
}