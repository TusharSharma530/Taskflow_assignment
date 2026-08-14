import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useBlocker, type Location } from 'react-router-dom';
import type { Priority } from '../types';
import { PRIORITY_OPTIONS } from '../types';
import { useBoard } from '../hooks/useBoard';
import { useToast } from '../hooks/useToast';
import { Modal } from '../components/Modal';
import { SHORTCUTS } from '../components/ShortcutsDialog';
import { Toggle } from '../components/Toggle';
import {
  ACCENTS,
  applyAccent,
  applyTheme,
  type Accent,
  type Theme,
} from '../utils/appearance';
import {
  BellIcon,
  BoardIcon,
  CheckIcon,
  CommandIcon,
  InfoIcon,
  PackageIcon,
  PaletteIcon,
  SunIcon,
  MoonIcon,
  TaskFlowLogo,
} from '../components/icons';

interface Preferences {
  theme: Theme;
  accent: Accent;
  defaultPriority: Priority;
  defaultColumn: string;
  showTaskCounts: boolean;
  notifyUpdates: boolean;
  notifyCompletions: boolean;
}

const DEFAULTS: Preferences = {
  theme: 'light',
  accent: 'purple',
  defaultPriority: 'MEDIUM',
  defaultColumn: 'To Do',
  showTaskCounts: true,
  notifyUpdates: true,
  notifyCompletions: true,
};

const FALLBACK_COLUMNS = ['To Do', 'In Progress', 'Done'];

const SECTIONS = [
  { id: 'general', label: 'General', icon: InfoIcon },
  { id: 'appearance', label: 'Appearance', icon: PaletteIcon },
  { id: 'board', label: 'Board', icon: BoardIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'shortcuts', label: 'Keyboard shortcuts', icon: CommandIcon },
  { id: 'about', label: 'About', icon: PackageIcon },
] as const;

const THEMES: { value: Theme; label: string; blurb: string; icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Light', blurb: 'Clean and bright', icon: SunIcon },
  { value: 'dark', label: 'Dark', blurb: 'Easy on the eyes', icon: MoonIcon },
];

function readKey<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    return stored !== null ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readPrefs(): Preferences {
  return {
    theme: readKey<Theme>('taskflow-theme', DEFAULTS.theme),
    accent: readKey<Accent>('taskflow-accent', DEFAULTS.accent),
    defaultPriority: readKey<Priority>('taskflow-default-priority', DEFAULTS.defaultPriority),
    defaultColumn: readKey<string>('taskflow-default-column', DEFAULTS.defaultColumn),
    showTaskCounts: readKey<boolean>('taskflow-show-task-counts', DEFAULTS.showTaskCounts),
    notifyUpdates: readKey<boolean>('taskflow-notify-updates', DEFAULTS.notifyUpdates),
    notifyCompletions: readKey<boolean>('taskflow-notify-completions', DEFAULTS.notifyCompletions),
  };
}

function writePrefs(prefs: Preferences): void {
  const write = (key: string, value: unknown): void => {
    window.localStorage.setItem(key, JSON.stringify(value));
  };
  write('taskflow-theme', prefs.theme);
  write('taskflow-accent', prefs.accent);
  write('taskflow-default-priority', prefs.defaultPriority);
  write('taskflow-default-column', prefs.defaultColumn);
  write('taskflow-show-task-counts', prefs.showTaskCounts);
  write('taskflow-notify-updates', prefs.notifyUpdates);
  write('taskflow-notify-completions', prefs.notifyCompletions);
}

function prefsEqual(a: Preferences, b: Preferences): boolean {
  return (
    a.theme === b.theme &&
    a.accent === b.accent &&
    a.defaultPriority === b.defaultPriority &&
    a.defaultColumn === b.defaultColumn &&
    a.showTaskCounts === b.showTaskCounts &&
    a.notifyUpdates === b.notifyUpdates &&
    a.notifyCompletions === b.notifyCompletions
  );
}

export function SettingsPage() {
  const { board } = useBoard();
  const toast = useToast();
  const [draft, setDraft] = useState<Preferences>(readPrefs);
  const [saved, setSaved] = useState<Preferences>(readPrefs);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeSection, setActiveSection] = useState('general');
  const savedTimer = useRef<number | undefined>(undefined);

  const dirty = !prefsEqual(draft, saved);

  useEffect(() => {
    applyTheme(draft.theme);
  }, [draft.theme]);

  useEffect(() => {
    applyAccent(draft.accent);
  }, [draft.accent]);

  useEffect(() => {
    if (dirty) {
      setSaveState('idle');
      window.clearTimeout(savedTimer.current);
    }
    return () => window.clearTimeout(savedTimer.current);
  }, [dirty]);

  function update<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(): Promise<void> {
    if (!dirty) {
      return;
    }
    setSaveState('saving');
    // Brief delay so the "Saving..." state is visible for this fast local write.
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    try {
      writePrefs(draft);
      setSaved(draft);
      applyTheme(draft.theme);
      applyAccent(draft.accent);
      setSaveState('saved');
      toast.success('Preferences saved');
      window.clearTimeout(savedTimer.current);
      savedTimer.current = window.setTimeout(() => setSaveState('idle'), 2400);
    } catch {
      setSaveState('idle');
      toast.error('Unable to save preferences. Please try again.');
    }
  }

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }: { currentLocation: Location; nextLocation: Location }) =>
        dirty && currentLocation.pathname !== nextLocation.pathname,
      [dirty],
    ),
  );

  useEffect(() => {
    const sections = SECTIONS.map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function scrollToSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const columnOptions =
    board && board.columns.length > 0
      ? board.columns.map((column) => column.title)
      : FALLBACK_COLUMNS;

  return (
    <div className="page settings-page">
      <header className="page-header settings-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your TaskFlow preferences and workspace behavior.</p>
        </div>
        <button
          type="button"
          className="button button-primary settings-save"
          disabled={!dirty || saveState === 'saving'}
          onClick={() => void handleSave()}
        >
          {saveState === 'saving' ? (
            <>
              <span className="button-spinner" aria-hidden="true" />
              Saving...
            </>
          ) : saveState === 'saved' ? (
            <>
              <CheckIcon width={16} height={16} />
              Preferences saved
            </>
          ) : (
            'Save preferences'
          )}
        </button>
      </header>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`settings-nav-item ${activeSection === section.id ? 'settings-nav-item-active' : ''}`}
              onClick={() => scrollToSection(section.id)}
              aria-current={activeSection === section.id ? 'true' : undefined}
            >
              <section.icon width={17} height={17} />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>

        <div className="settings-content">
          <section id="general" className="settings-card" aria-labelledby="general-title">
            <header className="settings-card-header">
              <h3 id="general-title" className="settings-card-title">
                General
              </h3>
              <p className="settings-card-sub">Your TaskFlow workspace at a glance.</p>
            </header>
            <div className="settings-card-body">
              <div className="setting-row">
                <div className="setting-row-label">
                  <h4 className="setting-row-title">Workspace board</h4>
                  <p className="setting-row-desc">Tasks are organized under this board.</p>
                </div>
                <span className="setting-row-value setting-row-value-strong">{board?.title ?? '—'}</span>
              </div>
              <div className="setting-row">
                <div className="setting-row-label">
                  <h4 className="setting-row-title">Preferences location</h4>
                  <p className="setting-row-desc">
                    Appearance and board preferences are saved on this device. Task data stays in
                    your local database.
                  </p>
                </div>
                <span className="setting-row-value">This device</span>
              </div>
            </div>
          </section>

          <section id="appearance" className="settings-card" aria-labelledby="appearance-title">
            <header className="settings-card-header">
              <h3 id="appearance-title" className="settings-card-title">
                Appearance
              </h3>
              <p className="settings-card-sub">Customize how TaskFlow looks on this device.</p>
            </header>
            <div className="settings-card-body">
              <div className="setting-block">
                <h4 className="setting-block-title">Theme</h4>
                <p className="setting-block-hint">Choose how TaskFlow looks on this device.</p>
                <div className="theme-picker" role="radiogroup" aria-label="Theme">
                  {THEMES.map((theme) => (
                    <label
                      key={theme.value}
                      className={`theme-card ${draft.theme === theme.value ? 'theme-card-active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="settings-theme"
                        value={theme.value}
                        checked={draft.theme === theme.value}
                        onChange={() => update('theme', theme.value)}
                        className="visually-hidden"
                      />
                      {draft.theme === theme.value ? (
                        <span className="theme-card-check" aria-hidden="true">
                          <CheckIcon width={14} height={14} />
                        </span>
                      ) : null}
                      <theme.icon width={22} height={22} />
                      <span className="theme-card-name">{theme.label}</span>
                      <span className="theme-card-blurb">{theme.blurb}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="setting-block">
                <h4 className="setting-block-title">Accent color</h4>
                <p className="setting-block-hint">
                  Used for buttons, links, and highlights across the app.
                </p>
                <div className="accent-picker" role="radiogroup" aria-label="Accent color">
                  {ACCENTS.map((accent) => (
                    <button
                      key={accent.value}
                      type="button"
                      role="radio"
                      aria-checked={draft.accent === accent.value}
                      aria-label={`${accent.label} accent`}
                      title={accent.label}
                      className={`accent-swatch ${draft.accent === accent.value ? 'accent-swatch-active' : ''}`}
                      style={{ '--accent-swatch': accent.color } as CSSProperties}
                      onClick={() => update('accent', accent.value)}
                    >
                      {draft.accent === accent.value ? (
                        <CheckIcon width={12} height={12} />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="board" className="settings-card" aria-labelledby="board-title">
            <header className="settings-card-header">
              <h3 id="board-title" className="settings-card-title">
                Board preferences
              </h3>
              <p className="settings-card-sub">Choose the defaults and behavior for your task board.</p>
            </header>
            <div className="settings-card-body">
              <div className="setting-row">
                <div className="setting-row-label">
                  <h4 className="setting-row-title">Default priority for new tasks</h4>
                  <p className="setting-row-desc">Applies when you create a task on the board.</p>
                </div>
                <select
                  className="setting-select"
                  value={draft.defaultPriority}
                  onChange={(event) => update('defaultPriority', event.target.value as Priority)}
                  aria-label="Default priority for new tasks"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="setting-row">
                <div className="setting-row-label">
                  <h4 className="setting-row-title">Default column for new tasks</h4>
                  <p className="setting-row-desc">The column new tasks start in on the board.</p>
                </div>
                <select
                  className="setting-select"
                  value={
                    columnOptions.includes(draft.defaultColumn)
                      ? draft.defaultColumn
                      : columnOptions[0]
                  }
                  onChange={(event) => update('defaultColumn', event.target.value)}
                  aria-label="Default column for new tasks"
                >
                  {columnOptions.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="setting-row">
                <div className="setting-row-label">
                  <h4 id="setting-show-counts" className="setting-row-title">
                    Show task counts
                  </h4>
                  <p className="setting-row-desc">Display the number of visible tasks in each column.</p>
                </div>
                <span className="setting-row-state" aria-hidden="true">
                  {draft.showTaskCounts ? 'On' : 'Off'}
                </span>
                <Toggle
                  checked={draft.showTaskCounts}
                  onChange={(checked) => update('showTaskCounts', checked)}
                  label="Show task counts"
                  labelledBy="setting-show-counts"
                />
              </div>
            </div>
          </section>

          <section id="notifications" className="settings-card" aria-labelledby="notifications-title">
            <header className="settings-card-header">
              <h3 id="notifications-title" className="settings-card-title">
                Notifications
              </h3>
              <p className="settings-card-sub">Manage how TaskFlow keeps you informed.</p>
            </header>
            <div className="settings-card-body">
              <div className="setting-row">
                <div className="setting-row-label">
                  <h4 id="setting-notify-updates" className="setting-row-title">
                    Task updates
                  </h4>
                  <p className="setting-row-desc">
                    Get notified when tasks are created, updated, or moved.
                  </p>
                </div>
                <span className="setting-row-state" aria-hidden="true">
                  {draft.notifyUpdates ? 'On' : 'Off'}
                </span>
                <Toggle
                  checked={draft.notifyUpdates}
                  onChange={(checked) => update('notifyUpdates', checked)}
                  label="Task updates"
                  labelledBy="setting-notify-updates"
                />
              </div>

              <div className="setting-row">
                <div className="setting-row-label">
                  <h4 id="setting-notify-completions" className="setting-row-title">
                    Task completions
                  </h4>
                  <p className="setting-row-desc">Get notified when tasks are marked as done.</p>
                </div>
                <span className="setting-row-state" aria-hidden="true">
                  {draft.notifyCompletions ? 'On' : 'Off'}
                </span>
                <Toggle
                  checked={draft.notifyCompletions}
                  onChange={(checked) => update('notifyCompletions', checked)}
                  label="Task completions"
                  labelledBy="setting-notify-completions"
                />
              </div>

              <p className="setting-card-note">
                Notification preferences are stored on this device. TaskFlow doesn't send in-app or
                push notifications yet.
              </p>
            </div>
          </section>

          <section id="shortcuts" className="settings-card" aria-labelledby="shortcuts-title">
            <header className="settings-card-header">
              <h3 id="shortcuts-title" className="settings-card-title">
                Keyboard shortcuts
              </h3>
              <p className="settings-card-sub">Speed up your workflow with these shortcuts.</p>
            </header>
            <div className="settings-card-body">
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
              <p className="settings-card-note">
                These shortcuts work across TaskFlow. Press ? at any time to view them.
              </p>
            </div>
          </section>

          <section id="about" className="settings-card" aria-labelledby="about-title">
            <header className="settings-card-header">
              <h3 id="about-title" className="settings-card-title">
                About TaskFlow
              </h3>
            </header>
            <div className="settings-card-body">
              <div className="about-row">
                <span className="about-logo" aria-hidden="true">
                  <TaskFlowLogo width={28} height={28} />
                </span>
                <div>
                  <p className="about-name">TaskFlow</p>
                  <p className="about-tagline">Built for focused teams.</p>
                </div>
                <span className="about-version">Version 1.0.0</span>
              </div>
              <p className="settings-card-note">
                TaskFlow stores task data in your local backend database and preferences in this
                browser. No account required.
              </p>
            </div>
          </section>
        </div>
      </div>

      {blocker.state === 'blocked' ? (
        <Modal
          title="Unsaved changes"
          description="You have unsaved changes."
          width="sm"
          onClose={() => blocker.reset()}
        >
          <div className="dialog-body">
            <p className="dialog-text">You have unsaved changes. Are you sure you want to leave?</p>
            <p className="dialog-muted">Your preferences won't be saved.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => blocker.reset()}
              >
                Keep editing
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => blocker.proceed()}
              >
                Leave anyway
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}