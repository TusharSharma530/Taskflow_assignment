import { badRequest } from '../errors/http.error';

/**
 * Parses a route param into a positive integer ID, rejecting "0", negatives,
 * floats and non-numeric values the same way for every resource.
 */
export function parsePositiveIntegerId(raw: unknown, field: string): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }
  return value;
}