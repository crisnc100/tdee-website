// Runs commitLog under a Web Lock named after the log's storage key, so saves
// from every tab on this site take turns: each one reads, applies and writes
// with no other tab's save in between. Without navigator.locks (older
// browsers, tests) commitLog runs directly, and only its check that the save
// is unchanged guards the write: that narrows the race but cannot close it.

import type { LogEntry, Result } from './entries';
import { LOG_STORAGE_KEY } from './schema';
import { commitLog, type LogState, type LogUpdate } from './storage';

/** The part of navigator.locks used here. */
export interface LogLocks {
  request<T>(name: string, callback: () => T | Promise<T>): Promise<T>;
}

/** Where a tab keeps its view of the log, read and written while the lock is held. */
export interface LogTab {
  get(): LogState | null;
  set(next: LogState): void;
}

export const LOG_LOADING: Result<LogEntry[]> = { ok: false, error: 'The log is still loading. Try again in a moment.' };

/** navigator.locks where the browser has it; it is missing outside secure contexts. */
export function browserLocks(): LogLocks | null {
  try {
    return typeof navigator !== 'undefined' && navigator.locks ? navigator.locks : null;
  } catch {
    return null;
  }
}

/**
 * Applies `update` to the latest saved log while holding the log's lock. The
 * tab's state is read inside the lock, so a commit queued behind another from
 * the same tab starts from that one's outcome.
 */
export async function commitAcrossTabs(
  locks: LogLocks | null,
  tab: LogTab,
  update: LogUpdate,
  today: () => string,
): Promise<Result<LogEntry[]>> {
  let ran = false;
  const run = (): Result<LogEntry[]> => {
    ran = true;
    const current = tab.get();
    if (!current) return LOG_LOADING;
    const { state, result } = commitLog(current, update, today());
    tab.set(state);
    return result;
  };
  if (!locks) return run();
  try {
    return await locks.request(LOG_STORAGE_KEY, run);
  } catch (error) {
    // The lock could not be taken (a sandboxed frame, say): save as without one.
    if (!ran) return run();
    throw error;
  }
}
