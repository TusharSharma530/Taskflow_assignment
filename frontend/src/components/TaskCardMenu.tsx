import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Column, Task } from '../types';
import { CheckIcon, EditIcon, TrashIcon } from './icons';

interface TaskCardMenuProps {
  task: Task;
  columns: Column[];
  onEdit: () => void;
  onDelete: () => void;
  onMove: (columnId: number) => void;
}

interface Position {
  top: number;
  left: number;
}

const MENU_WIDTH = 200;

export function TaskCardMenu({ task, columns, onEdit, onDelete, onMove }: TaskCardMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const otherColumns = columns.filter((column) => column.id !== task.columnId);
  const currentColumn = columns.find((column) => column.id === task.columnId);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const closeOnLayoutChange = (): void => setOpen(false);

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', closeOnLayoutChange, true);
    window.addEventListener('resize', closeOnLayoutChange);
    menuRef.current?.querySelector<HTMLElement>('.menu-item, .menu-group-label')?.focus();

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', closeOnLayoutChange, true);
      window.removeEventListener('resize', closeOnLayoutChange);
    };
  }, [open]);

  function openMenu(): void {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const moveRowCount = otherColumns.length;
    const height = 60 + 30 + moveRowCount * 36 + 40;
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropBelow = spaceBelow > height;
    const left = Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 12);

    setPosition({
      top: dropBelow ? rect.bottom + 6 : Math.max(12, rect.top - height - 6),
      left: Math.max(12, left),
    });
    setOpen(true);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="icon-button task-menu-button"
        onClick={openMenu}
        aria-label={`Actions for task "${task.title}"`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>

      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              className="dropdown"
              role="menu"
              aria-label={`Actions for task "${task.title}"`}
              style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
            >
              <button
                type="button"
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
              >
                <EditIcon width={15} height={15} />
                Edit task
              </button>

              <div className="menu-group">
                <div className="menu-group-label" tabIndex={-1}>
                  Move to
                </div>
                {otherColumns.length === 0 ? (
                  <div className="menu-note">Only one column</div>
                ) : null}
                {otherColumns.map((column) => (
                  <button
                    key={column.id}
                    type="button"
                    className="menu-item menu-item-indent"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      onMove(column.id);
                    }}
                  >
                    <span className="menu-item-check">
                      <CheckIcon width={14} height={14} />
                    </span>
                    {column.title}
                  </button>
                ))}
                {currentColumn ? (
                  <div className="menu-current" aria-label="Current column">
                    Currently in {currentColumn.title}
                  </div>
                ) : null}
              </div>

              <div className="menu-separator" />
              <button
                type="button"
                className="menu-item menu-item-danger"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
              >
                <TrashIcon width={15} height={15} />
                Delete task
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}