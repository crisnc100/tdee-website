'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { localToday, type LogEntry, type Result } from '@/lib/log/entries';
import { LOG_STORAGE_KEY } from '@/lib/log/schema';
import { commitLog, openLogState, refreshLog, type KeyValueStore, type LogState, type LogUpdate } from '@/lib/log/storage';

/** Reading window.localStorage itself throws when the browser blocks storage. */
function browserStore(): KeyValueStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

interface LogView {
  entries: LogEntry[];
  notice: string | null;
  saveError: string | null;
}

const EMPTY: LogView = { entries: [], notice: null, saveError: null };

// The daily log, kept in localStorage. Like useLocalStorage it starts empty on
// both server and client and loads after mount, so hydration never mismatches.
// Every change is applied to what is saved at that moment (see storage.ts), and
// a save in another tab shows up here through the storage event.
export function useDailyLog() {
  const [view, setView] = useState<LogView>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const state = useRef<LogState | null>(null);

  const show = useCallback((next: LogState) => {
    state.current = next;
    setView({ entries: next.entries, notice: next.notice, saveError: next.saveError });
  }, []);

  useEffect(() => {
    const store = browserStore();
    show(openLogState(store, localToday()));
    setLoaded(true);
    if (!store) return;

    const onStorage = (event: StorageEvent) => {
      // A null key means another tab cleared storage.
      if (event.storageArea !== store || (event.key !== null && event.key !== LOG_STORAGE_KEY)) return;
      if (state.current) show(refreshLog(state.current, localToday()));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [show]);

  /** Applies `update` to the latest saved entries and saves the result. A failed Result means nothing changed. */
  const commit = useCallback(
    (update: LogUpdate): Result<LogEntry[]> => {
      if (!state.current) return { ok: false, error: 'The log is still loading. Try again in a moment.' };
      const { state: next, result } = commitLog(state.current, update, localToday());
      show(next);
      return result;
    },
    [show],
  );

  return { ...view, loaded, commit };
}
