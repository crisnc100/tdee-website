// Daily log entries: one per calendar day, weight always stored in kg.
// Pure functions only; persistence lives in schema.ts and the useDailyLog hook.

import { DEFAULT_PARAMS } from '../engine/model';

export interface LogEntry {
  /** Calendar day, YYYY-MM-DD. */
  date: string;
  /** Morning weigh-in in kg. */
  weightKg?: number;
  /** Calories logged that day. */
  intakeKcal?: number;
}

export type WeightUnit = 'kg' | 'lbs';

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** The engine treats anything outside these as missing, so the log refuses them up front. */
export const WEIGHT_RANGE_KG: readonly [number, number] = DEFAULT_PARAMS.plausibleWeightKg;
export const INTAKE_RANGE_KCAL: readonly [number, number] = DEFAULT_PARAMS.plausibleIntakeKcal;
/** Earliest date the log accepts; keeps a typo'd year from creating a decades-long run. */
export const MIN_DATE = '2000-01-01';

const LBS_PER_KG = 2.20462; // same factor as calculator.ts
const DAY_MS = 86_400_000;
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDay(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = ISO_DAY.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

/** Whole days since 1970-01-01 for an ISO day. */
export function dayNumber(isoDay: string): number {
  const [y, mo, d] = isoDay.split('-').map(Number);
  return Math.round(Date.UTC(y, mo - 1, d) / DAY_MS);
}

export function isoFromDayNumber(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(isoDay: string, days: number): string {
  return isoFromDayNumber(dayNumber(isoDay) + days);
}

/** Today's date in the device's own time zone. */
export function localToday(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function kgFromDisplay(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : value / LBS_PER_KG;
}

export function displayFromKg(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg * LBS_PER_KG;
}

/** Weight as shown to the user: one decimal in their unit. */
export function formatWeight(kg: number, unit: WeightUnit): string {
  return displayFromKg(kg, unit).toFixed(1);
}

/** Gram precision: enough that a value typed in lbs reads back unchanged at one decimal. */
function roundKg(kg: number): number {
  return Math.round(kg * 1000) / 1000;
}

function inRange(value: number, [min, max]: readonly [number, number]): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

function weightRangeText(unit: WeightUnit): string {
  const [lo, hi] = WEIGHT_RANGE_KG.map((kg) => displayFromKg(kg, unit));
  if (unit === 'kg') return `${lo}–${hi} kg`;
  // Rounded inward, so every weight the message allows is accepted.
  return `${Math.ceil(lo * 10) / 10}–${Math.floor(hi * 10) / 10} lbs`;
}

export interface EntryCheckOptions {
  /** Latest date allowed (ISO day). Omit to allow any date. */
  maxDate?: string;
  /** Unit the error messages quote weights in. */
  unit?: WeightUnit;
}

/**
 * Checks and normalises one entry: a real calendar date, at least one value,
 * and every value inside the engine's plausible range. Weight is kept to the
 * gram and calories to the whole number.
 */
export function checkEntry(entry: LogEntry, options: EntryCheckOptions = {}): Result<LogEntry> {
  const unit = options.unit ?? 'kg';
  if (!isIsoDay(entry.date)) return { ok: false, error: 'Enter a valid date.' };
  if (entry.date < MIN_DATE) return { ok: false, error: `Dates before ${MIN_DATE} are not accepted.` };
  if (options.maxDate && entry.date > options.maxDate) return { ok: false, error: 'That date is in the future.' };

  const out: LogEntry = { date: entry.date };
  if (entry.weightKg !== undefined) {
    if (!inRange(entry.weightKg, WEIGHT_RANGE_KG)) {
      return { ok: false, error: `Weight must be between ${weightRangeText(unit)}.` };
    }
    out.weightKg = roundKg(entry.weightKg);
  }
  if (entry.intakeKcal !== undefined) {
    if (!inRange(entry.intakeKcal, INTAKE_RANGE_KCAL)) {
      const [lo, hi] = INTAKE_RANGE_KCAL;
      return { ok: false, error: `Calories must be between ${lo}–${hi.toLocaleString('en-US')}.` };
    }
    out.intakeKcal = Math.round(entry.intakeKcal);
  }
  if (out.weightKg === undefined && out.intakeKcal === undefined) {
    return { ok: false, error: 'Enter a weight, calories, or both.' };
  }
  return { ok: true, value: out };
}

export interface EntryDraft {
  date: string;
  /** As typed, in the display unit. Blank means "not logged". */
  weight: string;
  calories: string;
}

function parseNumber(text: string): number | undefined | null {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** Turns form text into a checked entry, converting the weight from the user's unit to kg. */
export function entryFromDraft(draft: EntryDraft, unit: WeightUnit, maxDate?: string): Result<LogEntry> {
  const weight = parseNumber(draft.weight);
  const calories = parseNumber(draft.calories);
  if (weight === null) return { ok: false, error: 'Weight must be a number.' };
  if (calories === null) return { ok: false, error: 'Calories must be a number.' };
  return checkEntry(
    {
      date: draft.date,
      ...(weight !== undefined ? { weightKg: kgFromDisplay(weight, unit) } : {}),
      ...(calories !== undefined ? { intakeKcal: calories } : {}),
    },
    { maxDate, unit },
  );
}

export function draftFromEntry(entry: LogEntry, unit: WeightUnit): EntryDraft {
  return {
    date: entry.date,
    weight: entry.weightKg === undefined ? '' : formatWeight(entry.weightKg, unit),
    calories: entry.intakeKcal === undefined ? '' : String(entry.intakeKcal),
  };
}

export function sortEntries(entries: readonly LogEntry[]): LogEntry[] {
  return [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Adds an entry. If the date already has one, the new values are laid over it,
 * so a morning weigh-in and an evening calorie total can be logged separately.
 */
export function addEntry(entries: readonly LogEntry[], entry: LogEntry): LogEntry[] {
  const existing = entries.find((e) => e.date === entry.date);
  if (!existing) return sortEntries([...entries, entry]);
  const merged: LogEntry = { ...existing };
  if (entry.weightKg !== undefined) merged.weightKg = entry.weightKg;
  if (entry.intakeKcal !== undefined) merged.intakeKcal = entry.intakeKcal;
  return entries.map((e) => (e.date === entry.date ? merged : e));
}

/** Replaces the entry for `originalDate` with `next`, which may move it to another date. */
export function updateEntry(entries: readonly LogEntry[], originalDate: string, next: LogEntry): Result<LogEntry[]> {
  if (!entries.some((e) => e.date === originalDate)) {
    return { ok: false, error: `There is no entry for ${originalDate}.` };
  }
  if (next.date !== originalDate && entries.some((e) => e.date === next.date)) {
    return { ok: false, error: `There is already an entry for ${next.date}. Edit or delete that one first.` };
  }
  return { ok: true, value: sortEntries([...entries.filter((e) => e.date !== originalDate), next]) };
}

export function deleteEntry(entries: readonly LogEntry[], date: string): LogEntry[] {
  return entries.filter((e) => e.date !== date);
}

export interface MergeSummary {
  added: number;
  replaced: number;
  kept: number;
}

/** Union by date; on a date both have, the incoming entry wins whole. */
export function mergeEntries(
  current: readonly LogEntry[],
  incoming: readonly LogEntry[],
): { entries: LogEntry[]; summary: MergeSummary } {
  const byDate = new Map(current.map((e) => [e.date, e]));
  let added = 0;
  let replaced = 0;
  for (const entry of incoming) {
    if (byDate.has(entry.date)) replaced += 1;
    else added += 1;
    byDate.set(entry.date, entry);
  }
  return {
    entries: sortEntries([...byDate.values()]),
    summary: { added, replaced, kept: current.length - replaced },
  };
}
