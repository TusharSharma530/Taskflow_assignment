import type { Priority } from '../types';
import { statusTone } from '../utils/taskStatus';
import { PriorityBadge } from './PriorityBadge';

interface TaskPreviewProps {
  title: string;
  description: string;
  priority: Priority;
  columnTitle: string;
}

export function TaskPreview({ title, description, priority, columnTitle }: TaskPreviewProps) {
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const tone = statusTone(columnTitle);

  return (
    <aside className="form-card task-preview" aria-label="Task preview">
      <header className="form-card-header">
        <h2 className="form-card-title">Task preview</h2>
      </header>

      <div className="task-preview-body">
        <p className="task-preview-label">Your new task</p>
        {trimmedTitle ? (
          <h3 className="task-preview-title">{trimmedTitle}</h3>
        ) : (
          <p className="task-preview-placeholder">Your task title will appear here.</p>
        )}
        {trimmedDescription ? (
          <p className="task-preview-description">{trimmedDescription}</p>
        ) : (
          <p className="task-preview-placeholder">Add a description to preview it.</p>
        )}
      </div>

      <footer className="task-preview-footer">
        <PriorityBadge priority={priority} />
        <span className={`status-chip status-chip-${tone}`}>
          <span className="status-chip-dot" aria-hidden="true" />
          {columnTitle}
        </span>
      </footer>
    </aside>
  );
}