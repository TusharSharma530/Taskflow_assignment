import type { Priority } from '../types';

const LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`priority-badge priority-${priority.toLowerCase()}`}>
      {LABELS[priority]}
    </span>
  );
}