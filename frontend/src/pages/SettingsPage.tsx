import { useEffect, useState } from 'react';
import type { Priority } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../hooks/useToast';
import { MoonIcon, SunIcon } from '../components/icons';

export type Theme = 'light' | 'dark';

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function SettingsPage() {
  const [theme, setTheme] = useLocalStorage<Theme>('taskflow-theme', 'light');
  const [defaultPriority, setDefaultPriority] = useLocalStorage<Priority>(
    'taskflow-default-priority',
    'MEDIUM',
  );
  const toast = useToast();
  const [localPriority, setLocalPriority] = useState<Priority>(defaultPriority);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function changePriority(value: Priority): void {
    setLocalPriority(value);
    setDefaultPriority(value);
    toast.success(`Default priority set to ${value}`);
  }

  return (
    <div className="page page-narrow">
      <header className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Preferences for your TaskFlow workspace.</p>
        </div>
      </header>

      <section className="settings-section" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading" className="settings-heading">
          Appearance
        </h2>
        <p className="settings-muted">Choose how TaskFlow looks on this device.</p>

        <div className="theme-toggle" role="radiogroup" aria-label="Theme">
          <label className={theme === 'light' ? 'theme-option theme-option-active' : 'theme-option'}>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={() => setTheme('light')}
            />
            <SunIcon width={18} height={18} />
            Light
          </label>
          <label className={theme === 'dark' ? 'theme-option theme-option-active' : 'theme-option'}>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
            />
            <MoonIcon width={18} height={18} />
            Dark
          </label>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="board-heading">
        <h2 id="board-heading" className="settings-heading">
          Board
        </h2>
        <p className="settings-muted">Presets that apply when you create a new task.</p>

        <div className="settings-row">
          <label className="form-label" htmlFor="default-priority">
            Default priority
          </label>
          <select
            id="default-priority"
            value={localPriority}
            onChange={(event) => changePriority(event.target.value as Priority)}
            className="settings-select"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </section>

      <p className="settings-note">Preferences are stored locally on this device only.</p>
    </div>
  );
}