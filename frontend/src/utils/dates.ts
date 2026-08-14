function parseDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** e.g. "Aug 15" */
export function formatShortDate(iso: string): string {
  const date = parseDate(iso);
  return date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
}

/** e.g. "Aug 15, 2026" */
export function formatMediumDate(iso: string): string {
  const date = parseDate(iso);
  return date
    ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
}

/** e.g. "August 15, 2026" */
export function formatLongDate(iso: string): string {
  const date = parseDate(iso);
  return date
    ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
}