'use client';

import { useState, useEffect, useCallback } from 'react';

// Starts from initialValue on both server and client, then loads the saved
// value after mount. Reading storage during the first render would make the
// server HTML and the first client render disagree (a hydration mismatch).
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch {
      try {
        window.localStorage.removeItem(key);
      } catch {}
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch {
          // ignore write errors (quota, private mode)
        }
        return valueToStore;
      });
    },
    [key]
  );

  return [storedValue, setValue] as const;
}
