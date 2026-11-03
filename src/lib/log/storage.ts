// Reading and writing the daily log through a Storage-like object, so the
// logic is testable without a browser. The useDailyLog hook passes
// window.localStorage.
//
// Several tabs can have the log open at once. A change is never applied to the
// tab's own copy: commitLog re-reads what is saved and applies the change to
// that, so one tab's save cannot wipe out another's. Just before writing it
// checks the save is still the one it read, and starts over if not. refreshLog
// lets a tab pick up another tab's save when the browser reports it.
//
// localStorage has no compare-and-swap, so that check narrows the window
// between read and write but cannot close it. crossTab.ts closes it by running
// commitLog under a Web Lock that every tab on this site takes.

import { addDays, checkSpan, latestAcceptedDate, MAX_SPAN_DAYS, type LogEntry, type Result } from './entries';
import { LOG_BACKUP_KEY, LOG_SET_ASIDE_KEY, LOG_STORAGE_KEY, loadStored, serializeStored } from './schema';

export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

export interface OpenedLog {
  entries: LogEntry[];
  /** Set when the saved log could not be used, in whole or in part; shown to the user. */
  notice: string | null;
  /** False when saving would overwrite a log that could not be backed up first. */
  canSave: boolean;
  /** The saved log's revision; absent when nothing is saved or the save has none. */
  revision?: number;
  /** The unreadable save that was backed up, which the first save may replace. */
  discarded?: string;
}

export const BLOCKED_STORAGE_NOTICE =
  'This browser is blocking storage, so the log will not be kept after you leave the page.';

const SAVE_FAILED =
  'The log could not be saved in this browser (storage may be full or blocked). Export it to keep a copy.';

const CONTENDED =
  'Another tab kept saving the log at the same moment, so this change was not made. Try again.';

/** How many times commitLog starts over when the save changes under it. */
export const MAX_COMMIT_ATTEMPTS = 3;

const UNREADABLE_ELSEWHERE =
  'Another tab saved the log in a form this page cannot read, perhaps from a newer version of this site. This tab ' +
  'has stopped saving so it does not overwrite that; reload the page. Export the log to keep changes made here.';

type SavedRead =
  | { status: 'ok'; raw: string | null; entries: LogEntry[]; setAside: LogEntry[]; revision?: number }
  | { status: 'unreadable'; raw: string; error: string }
  | { status: 'blocked' };

/**
 * Entries after today's allowance, or more than MAX_SPAN_DAYS before the
 * latest remaining entry, are set aside, so a bad save cannot make the engine
 * run for decades. Entries arrive sorted.
 */
function splitByDate(entries: LogEntry[], today: string): { kept: LogEntry[]; setAside: LogEntry[] } {
  const latest = latestAcceptedDate(today);
  const current = entries.filter((e) => e.date <= latest);
  const future = entries.filter((e) => e.date > latest);
  if (current.length === 0) return { kept: [], setAside: future };
  const earliest = addDays(current[current.length - 1].date, -(MAX_SPAN_DAYS - 1));
  return {
    kept: current.filter((e) => e.date >= earliest),
    setAside: [...current.filter((e) => e.date < earliest), ...future],
  };
}

/** Reads the saved log as it is now. With `today`, entries outside the accepted dates come back set aside. */
function readSaved(store: KeyValueStore, today?: string): SavedRead {
  let raw: string | null;
  try {
    raw = store.getItem(LOG_STORAGE_KEY);
  } catch {
    return { status: 'blocked' };
  }
  const loaded = loadStored(raw);
  if (loaded.status === 'unreadable') return { status: 'unreadable', raw: raw ?? '', error: loaded.error };
  const { kept, setAside } = today ? splitByDate(loaded.entries, today) : { kept: loaded.entries, setAside: [] };
  return { status: 'ok', raw, entries: kept, setAside, revision: loaded.status === 'ok' ? loaded.revision : undefined };
}

function copyTo(store: KeyValueStore, key: string, value: string): boolean {
  try {
    store.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function setAsideNotice(setAside: readonly LogEntry[], today: string, copied: boolean): string {
  const latest = latestAcceptedDate(today);
  const future = setAside.filter((e) => e.date > latest).length;
  const old = setAside.length - future;
  const counts = [
    future > 0 ? `${future.toLocaleString('en-US')} dated after ${latest}` : null,
    old > 0 ? `${old.toLocaleString('en-US')} dated more than ten years before the latest entry` : null,
  ]
    .filter(Boolean)
    .join(' and ');
  const lead = `Some saved entries are outside the dates this page accepts (${counts}), so they are not used.`;
  return copied
    ? `${lead} A copy of the saved log was kept in this browser's storage under "${LOG_SET_ASIDE_KEY}".`
    : `${lead} They could not be copied aside, so saving is paused to avoid losing them.`;
}

/**
 * Opens the saved log. Pass `today` to set aside entries outside the accepted
 * dates: the saved log is copied first, and saving is paused if it cannot be.
 */
export function openLog(store: KeyValueStore, today?: string): OpenedLog {
  const read = readSaved(store, today);
  if (read.status === 'blocked') return { entries: [], notice: BLOCKED_STORAGE_NOTICE, canSave: false };

  if (read.status === 'ok') {
    const opened: OpenedLog = { entries: read.entries, notice: null, canSave: true, revision: read.revision };
    if (read.setAside.length === 0 || !today) return opened;
    const copied = copyTo(store, LOG_SET_ASIDE_KEY, read.raw ?? '');
    return { ...opened, notice: setAsideNotice(read.setAside, today, copied), canSave: copied };
  }

  if (!copyTo(store, LOG_BACKUP_KEY, read.raw)) {
    return {
      entries: [],
      notice: `Your saved log could not be read (${read.error}) and could not be backed up, so saving is paused to avoid overwriting it.`,
      canSave: false,
    };
  }
  return {
    entries: [],
    notice: `Your saved log could not be read (${read.error}). A copy was kept in this browser's storage under "${LOG_BACKUP_KEY}", and a new log has been started.`,
    canSave: true,
    discarded: read.raw,
  };
}

/** Returns an error message, or null when the log was saved. */
export function saveLog(store: KeyValueStore, entries: readonly LogEntry[], revision?: number): string | null {
  return copyTo(store, LOG_STORAGE_KEY, serializeStored(entries, revision)) ? null : SAVE_FAILED;
}

/** One tab's view of the saved log. */
export interface LogState {
  /** Where this tab saves; null once it must not: storage is blocked, a save failed, or another tab saved an unreadable log. */
  store: KeyValueStore | null;
  entries: LogEntry[];
  /** Revision of the save these entries came from; this tab's next save writes the one after it. */
  revision: number;
  /** An unreadable save, backed up at open, that this tab's first save replaces. */
  discarded: string | null;
  /** Why some or all of the saved log is not in use. */
  notice: string | null;
  /** Why changes are not being saved. */
  saveError: string | null;
}

/** A change to the log: the next entries, or a failed Result to leave the log as it is. */
export type LogUpdate = (entries: LogEntry[]) => LogEntry[] | Result<LogEntry[]>;

export function openLogState(store: KeyValueStore | null, today: string): LogState {
  const opened: OpenedLog = store ? openLog(store, today) : { entries: [], notice: BLOCKED_STORAGE_NOTICE, canSave: false };
  return {
    store: opened.canSave ? store : null,
    entries: opened.entries,
    revision: opened.revision ?? 0,
    discarded: opened.discarded ?? null,
    notice: opened.notice,
    saveError: null,
  };
}

/** Takes up whatever is saved now, after another tab saved. */
export function refreshLog(state: LogState, today: string): LogState {
  if (!state.store) return state;
  const read = readSaved(state.store, today);
  if (read.status === 'ok') return { ...state, entries: read.entries, revision: read.revision ?? 0, discarded: null };
  if (read.status === 'unreadable' && read.raw !== state.discarded) {
    return { ...state, store: null, saveError: UNREADABLE_ELSEWHERE };
  }
  return state;
}

function applyUpdate(entries: LogEntry[], update: LogUpdate): Result<LogEntry[]> {
  const next = update(entries);
  const result: Result<LogEntry[]> = Array.isArray(next) ? { ok: true, value: next } : next;
  return result.ok ? checkSpan(result.value) : result;
}

/** Applies a change to this tab's entries only, for a tab that no longer saves. */
function commitUnsaved(state: LogState, update: LogUpdate): { state: LogState; result: Result<LogEntry[]> } {
  const result = applyUpdate(state.entries, update);
  return { state: result.ok ? { ...state, entries: result.value } : state, result };
}

/** True while the saved log is still exactly `raw`, the save a commit read. */
function stillSaved(store: KeyValueStore, raw: string | null): boolean {
  try {
    return store.getItem(LOG_STORAGE_KEY) === raw;
  } catch {
    return false;
  }
}

type Committed = { state: LogState; result: Result<LogEntry[]> };

/** One read-apply-write pass; 'stale' when another save landed after the read. */
function commitOnce(state: LogState, store: KeyValueStore, update: LogUpdate, today: string): Committed | 'stale' {
  const read = readSaved(store, today);
  if (read.status === 'blocked') return commitUnsaved({ ...state, store: null, saveError: SAVE_FAILED }, update);
  if (read.status === 'unreadable' && read.raw !== state.discarded) {
    return commitUnsaved({ ...state, store: null, saveError: UNREADABLE_ELSEWHERE }, update);
  }
  // Unreadable here means the save backed up at open, which a new log replaces.
  const base = read.status === 'ok' ? { entries: read.entries, revision: read.revision ?? 0 } : { entries: [], revision: 0 };
  const latest: LogState = {
    ...state,
    entries: base.entries,
    revision: base.revision,
    discarded: read.status === 'ok' ? null : state.discarded,
  };

  const result = applyUpdate(base.entries, update);
  if (!result.ok) return { state: latest, result };

  // The whole saved string, not just its revision: a save made before
  // revisions existed, or the unreadable one backed up at open, has none.
  if (!stillSaved(store, read.raw)) return 'stale';

  let notice = state.notice;
  if (read.status === 'ok' && read.setAside.length > 0) {
    const copied = copyTo(store, LOG_SET_ASIDE_KEY, read.raw ?? '');
    notice = setAsideNotice(read.setAside, today, copied);
    if (!copied) return { state: { ...latest, store: null, entries: result.value, notice, saveError: SAVE_FAILED }, result };
  }

  const revision = base.revision + 1;
  const saveError = saveLog(store, result.value, revision);
  if (saveError) return { state: { ...latest, store: null, entries: result.value, notice, saveError }, result };
  return { state: { ...latest, entries: result.value, revision, discarded: null, notice, saveError: null }, result };
}

/**
 * Applies `update` to the log as saved right now, not to this tab's copy, and
 * saves the result with the next revision. A failed Result from `update`, or a
 * log that would span more than MAX_SPAN_DAYS, leaves the log unchanged and
 * comes back as the result. If the change cannot be saved, it is kept in this
 * tab only and the tab stops saving, so it never writes over a newer save.
 *
 * If another tab saves between the read and the write, the read and `update`
 * are run again on the newer save, up to MAX_COMMIT_ATTEMPTS times, so
 * `update` must not depend on being called once. When every attempt is
 * overtaken the change is not made and the result says so. Without a lock
 * (crossTab.ts) a save can still land between the final check and the write.
 */
export function commitLog(state: LogState, update: LogUpdate, today: string): Committed {
  const { store } = state;
  if (!store) return commitUnsaved(state, update);
  for (let attempt = 0; attempt < MAX_COMMIT_ATTEMPTS; attempt++) {
    const committed = commitOnce(state, store, update, today);
    if (committed !== 'stale') return committed;
  }
  return { state: refreshLog(state, today), result: { ok: false, error: CONTENDED } };
}
