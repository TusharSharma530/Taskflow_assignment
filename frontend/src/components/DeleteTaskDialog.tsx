import { useState } from 'react';
import type { Task } from '../types';
import { Modal } from './Modal';

interface DeleteTaskDialogProps {
  task: Task;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function DeleteTaskDialog({ task, onConfirm, onClose }: DeleteTaskDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(): Promise<void> {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete the task. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <Modal title="Delete task?" onClose={onClose} width="sm">
      <div className="dialog-body">
        <p className="dialog-text">
          Are you sure you want to delete <strong>“{task.title}”</strong>?
        </p>
        <p className="dialog-muted">This action cannot be undone.</p>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

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
            onClick={confirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete task'}
          </button>
        </div>
      </div>
    </Modal>
  );
}