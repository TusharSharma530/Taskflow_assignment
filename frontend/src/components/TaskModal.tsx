import type { Column, Priority, TaskInput } from '../types';
import { Modal } from './Modal';
import { TaskFormFields } from './TaskFormFields';

interface TaskModalProps {
  columns: Column[];
  defaultColumnId?: number;
  initialPriority?: Priority;
  onSubmit: (input: TaskInput) => Promise<void>;
  onClose: () => void;
}

export function TaskModal({ columns, defaultColumnId, initialPriority, onSubmit, onClose }: TaskModalProps) {
  return (
    <Modal title="Create new task" description="Add a task to your board." onClose={onClose}>
      <TaskFormFields
        mode="create"
        columns={columns}
        defaultColumnId={defaultColumnId}
        initialPriority={initialPriority}
        onCancel={onClose}
        onSubmit={(input) => onSubmit(input as TaskInput)}
      />
    </Modal>
  );
}