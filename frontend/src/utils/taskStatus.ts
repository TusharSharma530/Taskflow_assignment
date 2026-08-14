/** Maps a column title to a status-chip tone class. */
export function statusTone(title: string): string {
  const normalized = title.trim().toLowerCase();
  if (normalized === 'in progress') {
    return 'progress';
  }
  if (normalized === 'done') {
    return 'done';
  }
  return 'neutral';
}