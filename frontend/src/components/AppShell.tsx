import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts';
import { MenuIcon, TaskFlowLogo } from './icons';
import { ShortcutsDialog } from './ShortcutsDialog';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { showShortcuts, setShowShortcuts } = useGlobalShortcuts();

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <header className="topbar">
        <button
          type="button"
          className="icon-button topbar-menu"
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation"
        >
          <MenuIcon width={20} height={20} />
        </button>
        <Link to="/board" className="topbar-brand" aria-label="TaskFlow home">
          <TaskFlowLogo width={20} height={20} />
          <span>TaskFlow</span>
        </Link>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <ShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}