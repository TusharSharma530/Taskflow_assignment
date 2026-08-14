import type { ReactNode } from 'react';
import { TaskFlowLogo } from './icons';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, message, action, icon }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon ?? <TaskFlowLogo width={28} height={28} />}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {action}
    </div>
  );
}