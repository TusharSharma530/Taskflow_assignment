import { useState } from 'react';

/**
 * Persists a value to localStorage with a safe read/write path.
 * UI preferences only — task data is never stored here.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const set = (next: T | ((current: T) => T)): void => {
    setValue((current) => {
      const resolved = typeof next === 'function' ? (next as (c: T) => T)(current) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // storage unavailable (e.g. private mode) — keep in-memory value
      }
      return resolved;
    });
  };

  return [value, set] as const;
}