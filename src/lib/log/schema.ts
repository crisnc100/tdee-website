// The versioned document the daily log is saved and exported as, and its
// strict parser. The same shape goes to localStorage and to export files, so an
// export can be read back by the same code that loads the saved log.
//
//   { "format": "tdee-daily-log", "version": 1, "exportedAt"?: ISO time,
//     "entries": [{ "date": "2026-11-03", "weightKg": 81.6, "intakeKcal": 2140 }, ...] }
//
// The saved copy also carries "revision", a count bumped by every save, so a
// tab can tell that another tab has saved since it last read. Exports leave it
// out and the parser ignores it, so it needs no version bump.
//
// Dates must fit the log's window: no later than today plus
// FUTURE_ALLOWANCE_DAYS, and no more than MAX_SPAN_DAYS first to last. An
// import outside it is refused; a saved log outside it is trimmed by
// storage.ts, which keeps a copy, so a bad save never breaks the page.
//
// Changing the shape means bumping LOG_SCHEMA_VERSION and adding a step to
// MIGRATIONS that upgrades the previous version, so older saves and exports
// keep loading.

import {
  FUTURE_ALLOWANCE_DAYS,
  checkEntry,
  checkSpan,
  latestAcceptedDate,
  sortEntries,
  type LogEntry,
  type Result,
} from './entries';

export const LOG_FORMAT = 'tdee-daily-log';
export const LOG_SCHEMA_VERSION = 1;
export const LOG_STORAGE_KEY = 'tdee-daily-log';
/** Where an unreadable saved log is copied before the app starts a fresh one. */
export const LOG_BACKUP_KEY = 'tdee-daily-log-unreadable';
/** Where a saved log is copied before entries outside the accepted dates are dropped from it. */
export const LOG_SET_ASIDE_KEY = 'tdee-daily-log-set-aside';
/** Larger files are refused before parsing. Ten years of daily entries is under 1 MB. */
export const MAX_IMPORT_BYTES = 5_000_000;

export interface LogDocument {
  format: typeof LOG_FORMAT;
  version: typeof LOG_SCHEMA_VERSION;
  exportedAt?: string;
  entries: LogEntry[];
}

export interface DateCheckOptions {
  /** Today's date. When given, rows dated more than FUTURE_ALLOWANCE_DAYS after it are refused. */
  today?: string;
}

type RawDocument = Record<string, unknown>;
/** Upgrades a document from version n (its key) to version n + 1. */
export type Migration = (doc: RawDocument) => RawDocument;

/** Empty while version 1 is current; version 2 would add `1: (doc) => ...` here. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = Object.freeze({});

const ENTRY_KEYS = new Set(['date', 'weightKg', 'intakeKcal']);
const MAX_LISTED_PROBLEMS = 3;

function isRecord(value: unknown): value is RawDocument {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Brings a document of any known version up to `target` by running each
 * migration in turn. Unknown, newer or unparseable versions are refused rather
 * than guessed at, so a save from a newer release is never overwritten blindly.
 */
export function migrateDocument(
  doc: unknown,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  target: number = LOG_SCHEMA_VERSION,
): Result<RawDocument> {
  if (!isRecord(doc) || doc.format !== LOG_FORMAT) {
    return { ok: false, error: 'This is not a TDEE daily log file.' };
  }
  const version = doc.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return { ok: false, error: 'The file has no valid version number.' };
  }
  if (version > target) {
    return {
      ok: false,
      error: `The file is version ${version}, made by a newer release. This page reads up to version ${target}.`,
    };
  }
  let current: RawDocument = doc;
  for (let v = version; v < target; v += 1) {
    const step = migrations[v];
    if (!step) return { ok: false, error: `Version ${v} files can no longer be read.` };
    current = { ...step(current), version: v + 1 };
  }
  return { ok: true, value: current };
}

function describeRow(index: number, row: unknown): string {
  const date = isRecord(row) && typeof row.date === 'string' ? ` (${row.date})` : '';
  return `Row ${index + 1}${date}`;
}

function checkRow(row: unknown, latest: string | undefined): Result<LogEntry> {
  if (!isRecord(row)) return { ok: false, error: 'is not an entry object.' };
  const unknown = Object.keys(row).find((key) => !ENTRY_KEYS.has(key));
  if (unknown !== undefined) return { ok: false, error: `has an unknown field "${unknown}".` };
  if (typeof row.date !== 'string') return { ok: false, error: 'has no date.' };

  const entry: LogEntry = { date: row.date };
  for (const key of ['weightKg', 'intakeKcal'] as const) {
    const value = row[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== 'number') return { ok: false, error: `has a ${key} that is not a number.` };
    entry[key] = value;
  }
  const checked = checkEntry(entry);
  if (!checked.ok) return { ok: false, error: `is invalid: ${checked.error}` };
  if (latest !== undefined && checked.value.date > latest) {
    return { ok: false, error: `is dated after ${latest}; dates more than ${FUTURE_ALLOWANCE_DAYS} days ahead are not accepted.` };
  }
  return checked;
}

interface ReadDocument {
  entries: LogEntry[];
  revision?: number;
}

/** The strict row checks of parseLogDocument, without the span check, plus the saved revision. */
function readDocument(raw: unknown, latest?: string): Result<ReadDocument> {
  const migrated = migrateDocument(raw);
  if (!migrated.ok) return migrated;
  const rows = migrated.value.entries;
  if (!Array.isArray(rows)) return { ok: false, error: 'The file has no list of entries.' };

  const problems: string[] = [];
  const entries: LogEntry[] = [];
  const firstRowByDate = new Map<string, number>();
  rows.forEach((row, index) => {
    const checked = checkRow(row, latest);
    if (!checked.ok) {
      problems.push(`${describeRow(index, row)} ${checked.error}`);
      return;
    }
    const earlier = firstRowByDate.get(checked.value.date);
    if (earlier !== undefined) {
      problems.push(`Rows ${earlier + 1} and ${index + 1} both have the date ${checked.value.date}.`);
      return;
    }
    firstRowByDate.set(checked.value.date, index);
    entries.push(checked.value);
  });

  if (problems.length > 0) {
    const listed = problems.slice(0, MAX_LISTED_PROBLEMS).join(' ');
    const more = problems.length > MAX_LISTED_PROBLEMS ? ` (and ${problems.length - MAX_LISTED_PROBLEMS} more)` : '';
    const count = problems.length === 1 ? '1 problem' : `${problems.length} problems`;
    return { ok: false, error: `${count} found. ${listed}${more}` };
  }
  const revision = migrated.value.revision;
  return {
    ok: true,
    value: {
      entries: sortEntries(entries),
      revision: typeof revision === 'number' && Number.isSafeInteger(revision) && revision >= 0 ? revision : undefined,
    },
  };
}

/**
 * Strict parse of a log document: the format and version must be known, every
 * row must be valid, no date may appear twice, and the dates must fit the
 * log's window. Any problem rejects the whole document, and the message names
 * up to three of them.
 */
export function parseLogDocument(raw: unknown, options: DateCheckOptions = {}): Result<LogEntry[]> {
  const read = readDocument(raw, options.today === undefined ? undefined : latestAcceptedDate(options.today));
  if (!read.ok) return read;
  const spanned = checkSpan(read.value.entries);
  return spanned.ok ? spanned : { ok: false, error: spanned.error };
}

export function toLogDocument(entries: readonly LogEntry[], exportedAt?: string): LogDocument {
  return {
    format: LOG_FORMAT,
    version: LOG_SCHEMA_VERSION,
    ...(exportedAt ? { exportedAt } : {}),
    entries: sortEntries(entries).map((e) => ({
      date: e.date,
      ...(e.weightKg !== undefined ? { weightKg: e.weightKg } : {}),
      ...(e.intakeKcal !== undefined ? { intakeKcal: e.intakeKcal } : {}),
    })),
  };
}

/** Pretty-printed export file contents. */
export function serializeExport(entries: readonly LogEntry[], exportedAt: Date): string {
  return `${JSON.stringify(toLogDocument(entries, exportedAt.toISOString()), null, 2)}\n`;
}

export function exportFileName(today: string): string {
  return `tdee-log-${today}.json`;
}

/** Compact form for localStorage, stamped with the save's revision. */
export function serializeStored(entries: readonly LogEntry[], revision?: number): string {
  const doc = toLogDocument(entries);
  return JSON.stringify(revision === undefined ? doc : { ...doc, revision });
}

function parseJson(text: string): Result<unknown> {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'The file is too large to be a daily log.' };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
}

/** Reads an import file's text. Size, JSON syntax and contents are all checked. */
export function parseImportText(text: string, options: DateCheckOptions = {}): Result<LogEntry[]> {
  const json = parseJson(text);
  return json.ok ? parseLogDocument(json.value, options) : json;
}

export type StoredLoad =
  | { status: 'empty'; entries: [] }
  | { status: 'ok'; entries: LogEntry[]; revision?: number }
  | { status: 'unreadable'; entries: []; error: string };

/**
 * Reads the saved log. Anything unreadable is reported, never silently
 * dropped. The date window is not checked here: storage.ts sets aside the
 * entries outside it instead of refusing the whole log.
 */
export function loadStored(raw: string | null): StoredLoad {
  if (raw === null || raw === '') return { status: 'empty', entries: [] };
  const json = parseJson(raw);
  const read = json.ok ? readDocument(json.value) : json;
  if (!read.ok) return { status: 'unreadable', entries: [], error: read.error };
  return { status: 'ok', entries: read.value.entries, revision: read.value.revision };
}
