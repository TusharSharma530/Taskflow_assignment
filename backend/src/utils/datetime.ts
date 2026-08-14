/**
 * Converts an ISO-8601 UTC string (the format the API uses everywhere) into
 * the `YYYY-MM-DD HH:MM:SS.mmm` literal MySQL accepts for DATETIME columns.
 * MySQL has no timezone on DATETIME; values are always stored/read as UTC.
 */
export function toMySqlDateTime(iso: string): string {
  return iso.slice(0, 23).replace('T', ' ');
}