import { describe, expect, it } from 'vitest';
import { MAX_SPAN_DAYS, addDays, addEntry, type LogEntry } from './entries';
import { runLogEngine } from './engine';
import { LOG_FORMAT, LOG_SCHEMA_VERSION, LOG_SET_ASIDE_KEY, LOG_STORAGE_KEY, loadStored, parseImportText, parseLogDocument } from './schema';
import { commitLog, openLog, openLogState, type KeyValueStore } from './storage';

const TODAY = '2026-11-03';
const doc = (entries: LogEntry[]) => ({ format: LOG_FORMAT, version: LOG_SCHEMA_VERSION, entries });
const text = (entries: LogEntry[]) => JSON.stringify(doc(entries));

/** The 141-byte file from the review: one real day and one two centuries ahead. */
const centuries: LogEntry[] = [
  { date: '2026-11-02', weightKg: 80 },
  { date: '2226-11-03', weightKg: 80 },
];

function memoryStore(initial: Record<string, string> = {}, failWrites = false) {
  const data = new Map(Object.entries(initial));
  const store: KeyValueStore = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      if (failWrites) throw new Error('QuotaExceededError');
      data.set(key, value);
    },
  };
  return { store, data };
}

describe('import date window', () => {
  it('refuses a date far in the future, naming the row', () => {
    const parsed = parseImportText(text(centuries), { today: TODAY });
    expect(parsed).toMatchObject({
      ok: false,
      error: expect.stringMatching(/Row 2 \(2226-11-03\) is dated after 2026-11-05; dates more than 2 days ahead/),
    });
  });

  it('allows two days past today, for time zones, and no more', () => {
    expect(parseImportText(text([{ date: '2026-11-05', weightKg: 80 }]), { today: TODAY }).ok).toBe(true);
    expect(parseImportText(text([{ date: '2026-11-06', weightKg: 80 }]), { today: TODAY }).ok).toBe(false);
  });

  it('refuses dates before the floor', () => {
    expect(parseImportText(text([{ date: '1999-12-31', weightKg: 80 }]), { today: TODAY })).toMatchObject({
      ok: false,
      error: expect.stringMatching(/Dates before 2000-01-01 are not accepted/),
    });
  });

  it('refuses a log longer than the span limit, with or without today', () => {
    const last = '2026-11-03';
    const fits = [{ date: addDays(last, -(MAX_SPAN_DAYS - 1)), weightKg: 80 }, { date: last, weightKg: 80 }];
    const tooLong = [{ date: addDays(last, -MAX_SPAN_DAYS), weightKg: 80 }, { date: last, weightKg: 80 }];
    expect(parseLogDocument(doc(fits), { today: TODAY }).ok).toBe(true);
    expect(parseLogDocument(doc(tooLong), { today: TODAY })).toEqual({
      ok: false,
      error:
        'The log would run from 2016-11-02 to 2026-11-03, 3,654 days; it can cover at most 3,653 days (ten years). ' +
        'Check for a mistyped year.',
    });
    expect(parseLogDocument(doc(tooLong)).ok).toBe(false);
  });
});

describe('saved log outside the date window', () => {
  it('loads the usable entries, keeps a copy, and says what was left out', () => {
    const raw = text(centuries);
    const { store, data } = memoryStore({ [LOG_STORAGE_KEY]: raw });
    // loadStored itself does not judge dates; it must not refuse the whole log.
    expect(loadStored(raw)).toMatchObject({ status: 'ok', entries: centuries });

    const opened = openLog(store, TODAY);
    expect(opened.entries).toEqual([centuries[0]]);
    expect(opened.canSave).toBe(true);
    expect(opened.notice).toMatch(/1 dated after 2026-11-05/);
    expect(opened.notice).toMatch(LOG_SET_ASIDE_KEY);
    expect(data.get(LOG_SET_ASIDE_KEY)).toBe(raw);

    // The results view runs the engine over what was loaded: one day, not 73,050.
    const engine = runLogEngine(opened.entries, { formulaTdeeKcal: 2500, weightKg: 80 });
    expect(engine?.dayCount).toBe(1);
  });

  it('drops the set-aside entries from the saved log on the next save', () => {
    const raw = text(centuries);
    const { store, data } = memoryStore({ [LOG_STORAGE_KEY]: raw });
    const state = openLogState(store, TODAY);
    // Opening alone leaves the saved log as it was.
    expect(data.get(LOG_STORAGE_KEY)).toBe(raw);

    const committed = commitLog(state, (current) => addEntry(current, { date: TODAY, weightKg: 79.8 }), TODAY);
    expect(committed.result.ok).toBe(true);
    expect(loadStored(data.get(LOG_STORAGE_KEY) ?? null).entries).toEqual([centuries[0], { date: TODAY, weightKg: 79.8 }]);
    expect(data.get(LOG_SET_ASIDE_KEY)).toBe(raw);
  });

  it('sets aside entries more than ten years before the latest', () => {
    const entries = [
      { date: '2010-01-01', weightKg: 90 },
      { date: '2026-11-01', weightKg: 80 },
      { date: '2026-11-02', weightKg: 80 },
    ];
    const opened = openLog(memoryStore({ [LOG_STORAGE_KEY]: text(entries) }).store, TODAY);
    expect(opened.entries).toEqual(entries.slice(1));
    expect(opened.notice).toMatch(/1 dated more than ten years before the latest entry/);
  });

  it('pauses saving when the copy cannot be kept', () => {
    const raw = text(centuries);
    const { store, data } = memoryStore({ [LOG_STORAGE_KEY]: raw }, true);
    const opened = openLog(store, TODAY);
    expect(opened.entries).toEqual([centuries[0]]);
    expect(opened.canSave).toBe(false);
    expect(opened.notice).toMatch(/could not be copied aside, so saving is paused/);
    expect(data.get(LOG_STORAGE_KEY)).toBe(raw);
  });
});
