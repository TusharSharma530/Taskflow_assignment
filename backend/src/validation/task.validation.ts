import type { Priority } from '../repositories/task.repository';

const PRIORITIES: readonly Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

/** Mirrors the frontend character limits so the API boundary is authoritative. */
export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MAX_LENGTH = 500;

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

function checkTitle(title: string): { ok: true; value: string } | { ok: false; error: string } {
  if (!title) {
    return { ok: false, error: 'Task title is required' };
  }
  if (title.length > TITLE_MAX_LENGTH) {
    return { ok: false, error: `Task title must be ${TITLE_MAX_LENGTH} characters or fewer` };
  }
  return { ok: true, value: title };
}

function checkDescription(
  description: string,
): { ok: true; value: string } | { ok: false; error: string } {
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    return {
      ok: false,
      error: `Task description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`,
    };
  }
  return { ok: true, value: description };
}

export interface ValidatedTaskInput {
  columnId: number;
  title: string;
  description: string | null;
  priority: Priority;
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

  const checkedTitle = checkTitle(typeof body.title === 'string' ? body.title.trim() : '');
  if (!checkedTitle.ok) {
    return checkedTitle;
  }

  const priority = body.priority === undefined || body.priority === null ? 'MEDIUM' : body.priority;
  if (typeof priority !== 'string' || !isPriority(priority)) {
    return { ok: false, error: 'Priority must be one of: LOW, MEDIUM, HIGH' };
  }

  let description: string | null = null;
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      return { ok: false, error: 'Task description must be a string' };
    }
    const checkedDescription = checkDescription(body.description.trim());
    if (!checkedDescription.ok) {
      return checkedDescription;
    }
    description = checkedDescription.value;
  }

  return {
    ok: true,
    value: {
      columnId: column.value,
      title: checkedTitle.value,
      description,
      priority,
    },
  };
}

export interface ValidatedUpdateInput {
  title?: string;
  description?: string | null;
  priority?: Priority;
}

/**
 * Validates an "update task" request. Only the fields present in the body
 * are returned; omitted fields are left untouched so the repository can
 * merge them with the existing row.
 */
export function validateUpdateTask(
  body: Record<string, unknown>,
): { ok: true; value: ValidatedUpdateInput } | { ok: false; error: string } {
  const result: ValidatedUpdateInput = {};
  let hasFields = false;

  if (body.title !== undefined) {
    if (typeof body.title !== 'string') {
      return { ok: false, error: 'Task title must be a string' };
    }
    const checkedTitle = checkTitle(body.title.trim());
    if (!checkedTitle.ok) {
      return checkedTitle;
    }
    result.title = checkedTitle.value;
    hasFields = true;
  }

  if (body.description !== undefined) {
    if (body.description === null) {
      result.description = null;
      hasFields = true;
    } else {
      if (typeof body.description !== 'string') {
        return { ok: false, error: 'Task description must be a string' };
      }
      const checkedDescription = checkDescription(body.description.trim());
      if (!checkedDescription.ok) {
        return checkedDescription;
      }
      result.description = checkedDescription.value;
      hasFields = true;
    }
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