import { Link, NavLink } from 'react-router-dom';
import { BoardIcon, ListIcon, SettingsIcon, TaskFlowLogo, CloseIcon } from './icons';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: '/board', label: 'Board', icon: BoardIcon },
  { to: '/tasks', label: 'All Tasks', icon: ListIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-label="Primary navigation">
        <div className="sidebar-header">
          <Link to="/board" className="sidebar-brand" onClick={() => onClose()}>
            <span className="sidebar-logo">
              <TaskFlowLogo width={22} height={22} />
            </span>
            <span className="sidebar-name">TaskFlow</span>
          </Link>
          <button
            type="button"
            className="icon-button sidebar-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              onClick={onClose}
            >
              <item.icon width={18} height={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-footer-name">TaskFlow</span>
          <span className="sidebar-footer-tagline">Lightweight team task management</span>
        </div>
      </aside>
      {open ? (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      ) : null}
    </>
  );
}