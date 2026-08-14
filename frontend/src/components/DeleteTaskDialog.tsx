import { useState } from 'react';
import type { Task } from '../types';
import { Modal } from './Modal';

interface DeleteTaskDialogProps {
  task: Task;
  columnTitle?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteTaskDialog({ task, columnTitle, onClose, onConfirm }: DeleteTaskDialogProps) {
  const [deleting, setDeleting] = useState(false);

  async function confirm(): Promise<void> {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal title="Delete task" description="This action cannot be undone." width="sm" onClose={onClose}>
      <div className="dialog-body">
        <p className="dialog-text">
          Are you sure you want to delete <strong>{task.title}</strong>?
        </p>
        <p className="dialog-muted">
          The task will be permanently removed{columnTitle ? ` from ${columnTitle}` : ''}.
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-danger"
            onClick={() => void confirm()}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete task'}
          </button>
        </div>
      </div>
    </Modal>
  );
}