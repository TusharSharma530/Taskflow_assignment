/**
 * Shared helpers for the MySQL repositories.
 *
 * mysql2 returns `DATETIME` columns as JS `Date`s and does not rename
 * snake_case columns, so every SELECT maps its rows through these helpers
 * to reconstruct the camelCase payloads the API exposes.
 */

export interface SqlRow {
  [key: string]: unknown;
}

/** Converts Date values inside a row to ISO-8601 strings, preserving keys. */
export function normalizeRow<T extends SqlRow>(row: T): T {
  const out = row as SqlRow;
  for (const key of Object.keys(out)) {
    if (out[key] instanceof Date) {
      out[key] = out[key].toISOString();
    }
  }
  return row;
}

export function normalizeRows<T extends SqlRow>(rows: T[]): T[] {
  for (const row of rows) {
    normalizeRow(row);
  }
  return rows;
}

export function normalizeCount(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  return Number(value);
}