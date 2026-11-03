'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LogEntry } from '@/lib/log/entries';
import { BLOCKED_STORAGE_NOTICE, openLog, saveLog, type KeyValueStore } from '@/lib/log/storage';

/** Reading window.localStorage itself throws when the browser blocks storage. */
function browserStore(): KeyValueStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// The daily log, kept in localStorage. Like useLocalStorage it starts empty on
// both server and client and loads after mount, so hydration never mismatches.
export function useDailyLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const store = useRef<KeyValueStore | null>(null);
  const current = useRef<LogEntry[]>([]);

  useEffect(() => {
    const found = browserStore();
    const opened = found ? openLog(found) : { entries: [], notice: BLOCKED_STORAGE_NOTICE, canSave: false };
    store.current = opened.canSave ? found : null;
    current.current = opened.entries;
    setEntries(opened.entries);
    setNotice(opened.notice);
    setLoaded(true);
  }, []);

  /** Replaces the log with `update` applied to the latest entries, and saves it. */
  const commit = useCallback((update: (entries: LogEntry[]) => LogEntry[]) => {
    const next = update(current.current);
    current.current = next;
    setEntries(next);
    if (store.current) setSaveError(saveLog(store.current, next));
    return next;
  }, []);

  return { entries, loaded, notice, saveError, commit };
}
