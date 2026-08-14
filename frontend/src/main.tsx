import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import App from './App';
import { applyAccent, applyTheme, type Accent } from './utils/appearance';
import './styles.css';

try {
  const storedTheme = window.localStorage.getItem('taskflow-theme');
  if (storedTheme && JSON.parse(storedTheme) === 'dark') {
    applyTheme('dark');
  }
  const storedAccent = window.localStorage.getItem('taskflow-accent');
  if (storedAccent) {
    applyAccent(JSON.parse(storedAccent) as Accent);
  }
} catch {
  // ignore — theme and accent fall back to defaults
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);