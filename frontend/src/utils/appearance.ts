export type Theme = 'light' | 'dark';

export type Accent = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'red' | 'teal' | 'slate';

export interface AccentOption {
  value: Accent;
  label: string;
  color: string;
}

export const ACCENTS: AccentOption[] = [
  { value: 'purple', label: 'Purple', color: '#4f46e5' },
  { value: 'blue', label: 'Blue', color: '#2563eb' },
  { value: 'green', label: 'Green', color: '#059669' },
  { value: 'orange', label: 'Orange', color: '#ea580c' },
  { value: 'pink', label: 'Pink', color: '#db2777' },
  { value: 'red', label: 'Red', color: '#dc2626' },
  { value: 'teal', label: 'Teal', color: '#0d9488' },
  { value: 'slate', label: 'Slate', color: '#64748b' },
];

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function applyAccent(accent: Accent): void {
  if (accent === 'purple') {
    document.documentElement.removeAttribute('data-accent');
  } else {
    document.documentElement.dataset.accent = accent;
  }
}