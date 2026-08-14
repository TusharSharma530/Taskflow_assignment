import type { Priority } from '../repositories/task.repository';

export interface TaskInput {
  columnId?: number;
  title?: string;
  description?: string | null;
  priority?: string;
}

export interface ValidatedTaskInput {
  columnId: number;
  title: string;
  description: string | null;
  priority: Priority;
}

const PRIORITIES: readonly Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

export function isPriority(value: unknown): value is Priority {
  return PRIORITIES.includes(value as Priority);
}

function toNumber(value: unknown, field: string): { ok: true; value: number } | { ok: false; error: string } {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, error: `${field} must be a positive integer` };
  }
  return { ok: true, value: n };
}

/**
 * Validates the body of a "create task" request. `description` is optional
 * and null/undefined are treated as "no description". Priority defaults to
 * MEDIUM, but an explicitly invalid priority is rejected.
 */
export function validateCreateTask(
  body: Record<string, unknown>,
): { ok: true; value: ValidatedTaskInput } | { ok: false; error: string } {
  const column = toNumber(body.columnId, 'columnId');
  if (!column.ok) {
    return column;
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return { ok: false, error: 'Task title is required' };
  }

  const priority = body.priority === undefined || body.priority === null ? 'MEDIUM' : body.priority;
  if (typeof priority !== 'string' || !isPriority(priority)) {
    return { ok: false, error: 'Priority must be one of: LOW, MEDIUM, HIGH' };
  }

  const description =
    body.description === undefined || body.description === null
      ? null
      : String(body.description).trim();

  return {
    ok: true,
    value: { columnId: column.value, title, description, priority },
  };
}

export interface ValidatedUpdateInput {
  title?: string;
  description: string | null;
  priority: Priority;
}

/**
 * Validates a "update task" request. Title, when provided, must not be
 * empty. Description and priority may each be updated independently.
 */
export function validateUpdateTask(
  body: Record<string, unknown>,
): { ok: true; value: ValidatedUpdateInput } | { ok: false; error: string } {
  const result: ValidatedUpdateInput = { description: null, priority: 'MEDIUM' };
  let hasFields = false;

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return { ok: false, error: 'Task title is required' };
    }
    result.title = body.title.trim();
    hasFields = true;
  }

  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      return { ok: false, error: 'Task description must be a string' };
    }
    result.description = body.description.trim();
    hasFields = true;
  } else if (body.description === null) {
    result.description = null;
  }

  if (body.priority !== undefined) {
    if (!isPriority(body.priority)) {
      return { ok: false, error: 'Priority must be one of: LOW, MEDIUM, HIGH' };
    }
    result.priority = body.priority;
    hasFields = true;
  }

  if (!hasFields) {
    return { ok: false, error: 'No fields to update were provided' };
  }

  return { ok: true, value: result };
}

export function validateMove(
  body: Record<string, unknown>,
): { ok: true; value: number } | { ok: false; error: string } {
  return toNumber(body.columnId, 'columnId');
}