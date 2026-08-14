import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isTyping) {
        return;
      }

      if (event.key === '?') {
        event.preventDefault();
        setShowShortcuts((current) => !current);
      } else if (event.key.toLowerCase() === 'n') {
        navigate('/tasks/new');
      } else if (event.key === '/') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('taskflow:focus-search'));
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return { showShortcuts, setShowShortcuts };
}