// The versioned document the daily log is saved and exported as, and its
// strict parser. The same shape goes to localStorage and to export files, so an
// export can be read back by the same code that loads the saved log.
//
//   { "format": "tdee-daily-log", "version": 1, "exportedAt"?: ISO time,
//     "entries": [{ "date": "2026-11-03", "weightKg": 81.6, "intakeKcal": 2140 }, ...] }
//
// Changing the shape means bumping LOG_SCHEMA_VERSION and adding a step to
// MIGRATIONS that upgrades the previous version, so older saves and exports
// keep loading.

import { checkEntry, sortEntries, type LogEntry, type Result } from './entries';

export const LOG_FORMAT = 'tdee-daily-log';
export const LOG_SCHEMA_VERSION = 1;
export const LOG_STORAGE_KEY = 'tdee-daily-log';
/** Where an unreadable saved log is copied before the app starts a fresh one. */
export const LOG_BACKUP_KEY = 'tdee-daily-log-unreadable';
/** Larger files are refused before parsing. Ten years of daily entries is under 1 MB. */
export const MAX_IMPORT_BYTES = 5_000_000;

export interface LogDocument {
  format: typeof LOG_FORMAT;
  version: typeof LOG_SCHEMA_VERSION;
  exportedAt?: string;
  entries: LogEntry[];
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

function checkRow(row: unknown): Result<LogEntry> {
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
  return checked;
}

/**
 * Strict parse of a log document: the format and version must be known, every
 * row must be valid, and no date may appear twice. Any problem rejects the
 * whole document, and the message names up to three of them.
 */
export function parseLogDocument(raw: unknown): Result<LogEntry[]> {
  const migrated = migrateDocument(raw);
  if (!migrated.ok) return migrated;
  const rows = migrated.value.entries;
  if (!Array.isArray(rows)) return { ok: false, error: 'The file has no list of entries.' };

  const problems: string[] = [];
  const entries: LogEntry[] = [];
  const firstRowByDate = new Map<string, number>();
  rows.forEach((row, index) => {
    const checked = checkRow(row);
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
  return { ok: true, value: sortEntries(entries) };
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

/** Compact form for localStorage. */
export function serializeStored(entries: readonly LogEntry[]): string {
  return JSON.stringify(toLogDocument(entries));
}

/** Reads an import file's text. Size, JSON syntax and contents are all checked. */
export function parseImportText(text: string): Result<LogEntry[]> {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'The file is too large to be a daily log.' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
  return parseLogDocument(raw);
}

export type StoredLoad =
  | { status: 'empty'; entries: [] }
  | { status: 'ok'; entries: LogEntry[] }
  | { status: 'unreadable'; entries: []; error: string };

/** Reads the saved log. Anything unreadable is reported, never silently dropped. */
export function loadStored(raw: string | null): StoredLoad {
  if (raw === null || raw === '') return { status: 'empty', entries: [] };
  const parsed = parseImportText(raw);
  if (!parsed.ok) return { status: 'unreadable', entries: [], error: parsed.error };
  return { status: 'ok', entries: parsed.value };
}
