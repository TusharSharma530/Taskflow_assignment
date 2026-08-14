import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import App from './App';
import './styles.css';

try {
  const stored = window.localStorage.getItem('taskflow-theme');
  if (stored && JSON.parse(stored) === 'dark') {
    document.documentElement.dataset.theme = 'dark';
  }
} catch {
  // ignore — theme falls back to light
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);