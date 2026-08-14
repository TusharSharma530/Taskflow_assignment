import { Modal } from './Modal';

export interface ShortcutItem {
  keys: string[];
  label: string;
}

export const SHORTCUTS: ShortcutItem[] = [
  { keys: ['N'], label: 'Create a new task' },
  { keys: ['/'], label: 'Focus the task search' },
  { keys: ['?'], label: 'Show this shortcuts overview' },
  { keys: ['Esc'], label: 'Close dialogs and menus' },
];

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <Modal title="Keyboard shortcuts" description="Speed up your workflow." width="sm" onClose={onClose}>
      <ul className="shortcut-list">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.label} className="shortcut-row">
            <span className="shortcut-keys">
              {shortcut.keys.map((key) => (
                <kbd key={key} className="kbd">
                  {key}
                </kbd>
              ))}
            </span>
            <span className="shortcut-label">{shortcut.label}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}