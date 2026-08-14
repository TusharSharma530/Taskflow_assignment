import type { Task, TaskUpdate } from '../types';
import { Modal } from './Modal';
import { TaskFormFields } from './TaskFormFields';

interface EditTaskModalProps {
  task: Task;
  onSubmit: (input: TaskUpdate) => Promise<void>;
  onClose: () => void;
}

export function EditTaskModal({ task, onSubmit, onClose }: EditTaskModalProps) {
  return (
    <Modal title="Edit task" description="Update the details of this task." onClose={onClose}>
      <TaskFormFields
        mode="edit"
        task={task}
        onCancel={onClose}
        onSubmit={(input) => onSubmit(input as TaskUpdate)}
      />
    </Modal>
  );
}