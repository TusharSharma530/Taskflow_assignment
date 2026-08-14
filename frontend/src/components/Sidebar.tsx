import type { ComponentType } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BoardIcon, CloseIcon, ListIcon, SettingsIcon, TaskFlowLogo } from './icons';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ width?: number; height?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/board', label: 'Board', icon: BoardIcon },
  { to: '/tasks', label: 'All Tasks', icon: ListIcon },
];

const SETTINGS_ITEMS: NavItem[] = [{ to: '/settings', label: 'Settings', icon: SettingsIcon }];

function isActive(item: NavItem, pathname: string): boolean {
  if (item.to === '/tasks') {
    return pathname === '/tasks' || pathname.startsWith('/tasks/');
  }
  if (item.to === '/board') {
    return pathname === '/board' || pathname === '/';
  }
  return pathname === item.to;
}

interface NavLinkItemProps {
  item: NavItem;
  pathname: string;
  onClose: () => void;
}

function NavLinkItem({ item, pathname, onClose }: NavLinkItemProps) {
  const active = isActive(item, pathname);
  return (
    <Link
      to={item.to}
      className={`sidebar-link${active ? ' sidebar-link-active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={onClose}
    >
      <item.icon width={18} height={18} />
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = useLocation().pathname;

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

        <nav className="sidebar-nav" aria-label="Pages">
          <div className="sidebar-group">
            <span className="sidebar-label">Workspace</span>
            {NAV_ITEMS.map((item) => (
              <NavLinkItem key={item.to} item={item} pathname={pathname} onClose={onClose} />
            ))}
          </div>
          <div className="sidebar-group">
            <span className="sidebar-label">Settings</span>
            {SETTINGS_ITEMS.map((item) => (
              <NavLinkItem key={item.to} item={item} pathname={pathname} onClose={onClose} />
            ))}
          </div>
        </nav>

        <footer className="sidebar-footer">
          <span className="sidebar-footer-name">TaskFlow</span>
          <span className="sidebar-footer-tagline">Lightweight task management</span>
        </footer>
      </aside>
      {open ? (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      ) : null}
    </>
  );
}