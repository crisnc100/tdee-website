// Reading and writing the daily log through a Storage-like object, so the
// logic is testable without a browser. The useDailyLog hook passes
// window.localStorage.

import type { LogEntry } from './entries';
import { LOG_BACKUP_KEY, LOG_STORAGE_KEY, loadStored, serializeStored } from './schema';

export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

export interface OpenedLog {
  entries: LogEntry[];
  /** Set when the saved log could not be used; shown to the user. */
  notice: string | null;
  /** False when saving would overwrite a log that could not be backed up first. */
  canSave: boolean;
}

export const BLOCKED_STORAGE_NOTICE =
  'This browser is blocking storage, so the log will not be kept after you leave the page.';

export function openLog(store: KeyValueStore): OpenedLog {
  let raw: string | null;
  try {
    raw = store.getItem(LOG_STORAGE_KEY);
  } catch {
    return { entries: [], notice: BLOCKED_STORAGE_NOTICE, canSave: false };
  }
  const loaded = loadStored(raw);
  if (loaded.status !== 'unreadable') return { entries: loaded.entries, notice: null, canSave: true };

  try {
    store.setItem(LOG_BACKUP_KEY, raw ?? '');
  } catch {
    return {
      entries: [],
      notice: `Your saved log could not be read (${loaded.error}) and could not be backed up, so saving is paused to avoid overwriting it.`,
      canSave: false,
    };
  }
  return {
    entries: [],
    notice: `Your saved log could not be read (${loaded.error}). A copy was kept in this browser's storage under "${LOG_BACKUP_KEY}", and a new log has been started.`,
    canSave: true,
  };
}

/** Returns an error message, or null when the log was saved. */
export function saveLog(store: KeyValueStore, entries: readonly LogEntry[]): string | null {
  try {
    store.setItem(LOG_STORAGE_KEY, serializeStored(entries));
    return null;
  } catch {
    return 'The log could not be saved in this browser (storage may be full or blocked). Export it to keep a copy.';
  }
}
