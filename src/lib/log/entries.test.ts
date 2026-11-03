import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS } from '../engine/model';
import {
  INTAKE_RANGE_KCAL,
  WEIGHT_RANGE_KG,
  addDays,
  addEntry,
  checkEntry,
  dayNumber,
  deleteEntry,
  draftFromEntry,
  entryFromDraft,
  formatWeight,
  isIsoDay,
  localToday,
  mergeEntries,
  updateEntry,
  type LogEntry,
} from './entries';

describe('dates', () => {
  it('accepts real calendar days only', () => {
    expect(isIsoDay('2026-11-03')).toBe(true);
    expect(isIsoDay('2024-02-29')).toBe(true);
    expect(isIsoDay('2025-02-29')).toBe(false);
    expect(isIsoDay('2026-13-01')).toBe(false);
    expect(isIsoDay('2026-11-3')).toBe(false);
    expect(isIsoDay('2026-11-03T00:00:00Z')).toBe(false);
    expect(isIsoDay(20261103)).toBe(false);
  });

  it('counts days across month, year and DST boundaries', () => {
    expect(dayNumber('2026-11-02') - dayNumber('2026-10-31')).toBe(2);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09'); // US DST start
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('reads today in local time', () => {
    expect(localToday(new Date(2026, 10, 3, 23, 59))).toBe('2026-11-03');
  });
});

describe('checkEntry', () => {
  it('uses the engine’s plausible ranges', () => {
    expect(WEIGHT_RANGE_KG).toEqual(DEFAULT_PARAMS.plausibleWeightKg);
    expect(INTAKE_RANGE_KCAL).toEqual(DEFAULT_PARAMS.plausibleIntakeKcal);
  });

  it('accepts the range ends and rejects values just outside', () => {
    const [wLo, wHi] = WEIGHT_RANGE_KG;
    const [iLo, iHi] = INTAKE_RANGE_KCAL;
    expect(checkEntry({ date: '2026-11-03', weightKg: wLo }).ok).toBe(true);
    expect(checkEntry({ date: '2026-11-03', weightKg: wHi }).ok).toBe(true);
    expect(checkEntry({ date: '2026-11-03', intakeKcal: iLo }).ok).toBe(true);
    expect(checkEntry({ date: '2026-11-03', intakeKcal: iHi }).ok).toBe(true);
    expect(checkEntry({ date: '2026-11-03', weightKg: wLo - 0.01 })).toMatchObject({ ok: false, error: expect.stringMatching(/weight/i) });
    expect(checkEntry({ date: '2026-11-03', weightKg: wHi + 0.01 })).toMatchObject({ ok: false });
    expect(checkEntry({ date: '2026-11-03', intakeKcal: -1 })).toMatchObject({ ok: false, error: expect.stringMatching(/calories/i) });
    expect(checkEntry({ date: '2026-11-03', intakeKcal: iHi + 1 })).toMatchObject({ ok: false });
    expect(checkEntry({ date: '2026-11-03', weightKg: Number.NaN })).toMatchObject({ ok: false });
    expect(checkEntry({ date: '2026-11-03', intakeKcal: Number.POSITIVE_INFINITY })).toMatchObject({ ok: false });
  });

  it('needs at least one value, a valid date, and no future date when a limit is given', () => {
    expect(checkEntry({ date: '2026-11-03' })).toMatchObject({ ok: false, error: expect.stringMatching(/weight, calories, or both/) });
    expect(checkEntry({ date: '2026-02-30', weightKg: 80 })).toMatchObject({ ok: false, error: expect.stringMatching(/date/i) });
    expect(checkEntry({ date: '1999-12-31', weightKg: 80 })).toMatchObject({ ok: false });
    expect(checkEntry({ date: '2026-11-04', weightKg: 80 }, { maxDate: '2026-11-03' })).toMatchObject({ ok: false, error: expect.stringMatching(/future/) });
    expect(checkEntry({ date: '2026-11-03', weightKg: 80 }, { maxDate: '2026-11-03' }).ok).toBe(true);
  });

  it('rounds weight to the gram and calories to the whole number', () => {
    expect(checkEntry({ date: '2026-11-03', weightKg: 81.64672, intakeKcal: 2140.6 })).toEqual({
      ok: true,
      value: { date: '2026-11-03', weightKg: 81.647, intakeKcal: 2141 },
    });
  });

  it('quotes the weight range in the user’s unit', () => {
    expect(checkEntry({ date: '2026-11-03', weightKg: 400 }, { unit: 'lbs' })).toMatchObject({
      ok: false,
      error: 'Weight must be between 55.2–771.6 lbs.',
    });
  });
});

describe('form drafts', () => {
  it('stores pounds as kilograms and shows them back unchanged', () => {
    const result = entryFromDraft({ date: '2026-11-03', weight: '180', calories: '2100' }, 'lbs');
    expect(result).toEqual({ ok: true, value: { date: '2026-11-03', weightKg: 81.647, intakeKcal: 2100 } });
    if (!result.ok) throw new Error('unreachable');
    expect(draftFromEntry(result.value, 'lbs')).toEqual({ date: '2026-11-03', weight: '180.0', calories: '2100' });
    expect(formatWeight(result.value.weightKg!, 'kg')).toBe('81.6');
  });

  it('round-trips every one-decimal lbs value in the range', () => {
    for (let tenths = 552; tenths <= 7716; tenths += 7) {
      const typed = (tenths / 10).toFixed(1);
      const result = entryFromDraft({ date: '2026-11-03', weight: typed, calories: '' }, 'lbs');
      expect(result.ok).toBe(true);
      if (result.ok) expect(formatWeight(result.value.weightKg!, 'lbs')).toBe(typed);
    }
  });

  it('treats blanks as not logged and rejects text that is not a number', () => {
    expect(entryFromDraft({ date: '2026-11-03', weight: ' ', calories: '1900' }, 'kg')).toEqual({
      ok: true,
      value: { date: '2026-11-03', intakeKcal: 1900 },
    });
    expect(entryFromDraft({ date: '2026-11-03', weight: '80,5', calories: '' }, 'kg')).toEqual({
      ok: true,
      value: { date: '2026-11-03', weightKg: 80.5 },
    });
    expect(entryFromDraft({ date: '2026-11-03', weight: '80kg', calories: '' }, 'kg')).toMatchObject({ ok: false, error: 'Weight must be a number.', field: 'weight' });
    expect(entryFromDraft({ date: '2026-11-03', weight: '1,234,5', calories: '' }, 'kg')).toMatchObject({ ok: false, field: 'weight' });
    expect(entryFromDraft({ date: '2026-11-03', weight: '', calories: '2,100' }, 'kg')).toEqual({
      ok: true,
      value: { date: '2026-11-03', intakeKcal: 2100 },
    });
    expect(entryFromDraft({ date: '2026-11-03', weight: '', calories: '2,1' }, 'kg')).toMatchObject({ ok: false, field: 'calories' });
    expect(entryFromDraft({ date: '2026-11-03', weight: '', calories: 'lots' }, 'kg')).toMatchObject({ ok: false, error: 'Calories must be a number.' });
    expect(entryFromDraft({ date: '2026-11-03', weight: '', calories: '' }, 'kg')).toMatchObject({ ok: false });
  });
});

describe('add, edit and delete', () => {
  const log: LogEntry[] = [
    { date: '2026-11-01', weightKg: 80, intakeKcal: 2000 },
    { date: '2026-11-03', weightKg: 79.6 },
  ];

  it('adds in date order', () => {
    expect(addEntry(log, { date: '2026-11-02', weightKg: 79.8 }).map((e) => e.date)).toEqual([
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
    ]);
  });

  it('lays a second entry for the same date over the first, keeping fields it leaves out', () => {
    expect(addEntry(log, { date: '2026-11-03', intakeKcal: 2200 })).toEqual([
      log[0],
      { date: '2026-11-03', weightKg: 79.6, intakeKcal: 2200 },
    ]);
    expect(addEntry(log, { date: '2026-11-01', weightKg: 80.4 })[0]).toEqual({ date: '2026-11-01', weightKg: 80.4, intakeKcal: 2000 });
  });

  it('edits by replacing the entry, which can clear a field or move the date', () => {
    expect(updateEntry(log, '2026-11-01', { date: '2026-11-01', weightKg: 80.2 })).toEqual({
      ok: true,
      value: [{ date: '2026-11-01', weightKg: 80.2 }, log[1]],
    });
    expect(updateEntry(log, '2026-11-01', { date: '2026-11-02', weightKg: 80 })).toEqual({
      ok: true,
      value: [{ date: '2026-11-02', weightKg: 80 }, log[1]],
    });
  });

  it('refuses an edit onto a date that already has an entry, or of an entry that is gone', () => {
    expect(updateEntry(log, '2026-11-01', { date: '2026-11-03', weightKg: 80 })).toMatchObject({ ok: false });
    expect(updateEntry(log, '2026-10-01', { date: '2026-10-01', weightKg: 80 })).toMatchObject({ ok: false });
  });

  it('deletes by date and leaves the input untouched', () => {
    const before = structuredClone(log);
    expect(deleteEntry(log, '2026-11-01')).toEqual([log[1]]);
    expect(deleteEntry(log, '2026-10-01')).toEqual(log);
    expect(log).toEqual(before);
  });
});

describe('mergeEntries', () => {
  const current: LogEntry[] = [
    { date: '2026-11-01', weightKg: 80, intakeKcal: 2000 },
    { date: '2026-11-02', weightKg: 79.8 },
  ];

  it('lets the incoming entry win whole on a shared date and keeps the rest', () => {
    const incoming: LogEntry[] = [
      { date: '2026-11-02', intakeKcal: 2300 },
      { date: '2026-11-04', weightKg: 79.1 },
    ];
    expect(mergeEntries(current, incoming)).toEqual({
      entries: [current[0], { date: '2026-11-02', intakeKcal: 2300 }, { date: '2026-11-04', weightKg: 79.1 }],
      summary: { added: 1, replaced: 1, kept: 1 },
    });
  });

  it('is the identity for an empty import and a copy for an empty log', () => {
    expect(mergeEntries(current, [])).toEqual({ entries: current, summary: { added: 0, replaced: 0, kept: 2 } });
    expect(mergeEntries([], current)).toEqual({ entries: current, summary: { added: 2, replaced: 0, kept: 0 } });
  });
});
