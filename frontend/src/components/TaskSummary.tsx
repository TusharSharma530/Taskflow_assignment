import type { Priority, Task } from '../types';
import { statusTone } from '../utils/taskStatus';
import { PriorityBadge } from './PriorityBadge';

interface TaskSummaryProps {
  task: Task;
  columnTitle: string;
  priority?: Priority;
}

function formatCreated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function TaskSummary({ task, columnTitle, priority }: TaskSummaryProps) {
  const tone = statusTone(columnTitle);
  const created = formatCreated(task.createdAt);

  return (
    <aside className="form-card task-summary" aria-label="Task summary">
      <header className="form-card-header">
        <h2 className="form-card-title">Task summary</h2>
      </header>

      <div className="task-summary-scroll">
        <dl className="task-summary-list">
          <div className="task-summary-item">
            <dt className="task-summary-key">Status</dt>
            <dd className="task-summary-value">
              <span className={`status-chip status-chip-${tone}`}>
                <span className="status-chip-dot" aria-hidden="true" />
                {columnTitle}
              </span>
            </dd>
          </div>

          <div className="task-summary-item">
            <dt className="task-summary-key">Priority</dt>
            <dd className="task-summary-value">
              <PriorityBadge priority={priority ?? task.priority} />
            </dd>
          </div>

          <div className="task-summary-item">
            <dt className="task-summary-key">Created</dt>
            <dd className="task-summary-value">{created || '—'}</dd>
          </div>

          <div className="task-summary-item">
            <dt className="task-summary-key">Task ID</dt>
            <dd className="task-summary-value task-summary-id">#{task.id}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}