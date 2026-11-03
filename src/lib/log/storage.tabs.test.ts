import { describe, expect, it } from 'vitest';
import { addDays, addEntry, deleteEntry, updateEntry, type LogEntry } from './entries';
import { LOG_BACKUP_KEY, LOG_FORMAT, LOG_STORAGE_KEY, loadStored, serializeStored } from './schema';
import { commitLog, openLogState, refreshLog, type KeyValueStore, type LogState } from './storage';

const TODAY = '2026-11-03';
const nov2: LogEntry = { date: '2026-11-02', weightKg: 80.4 };
const nov3: LogEntry = { date: '2026-11-03', weightKg: 80.1, intakeKcal: 2100 };

/** One fake localStorage that every "tab" in a test shares. */
function sharedStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  let failWrites = false;
  const store: KeyValueStore = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      if (failWrites) throw new Error('QuotaExceededError');
      data.set(key, value);
    },
  };
  const saved = () => {
    const loaded = loadStored(data.get(LOG_STORAGE_KEY) ?? null);
    return { entries: loaded.entries, revision: loaded.status === 'ok' ? loaded.revision : undefined };
  };
  return { store, data, saved, failWrites: () => (failWrites = true) };
}

const add = (state: LogState, entry: LogEntry) => commitLog(state, (current) => addEntry(current, entry), TODAY);

describe('two tabs on one saved log', () => {
  it.each([
    ['A then B', 'A'],
    ['B then A', 'B'],
  ])('keeps both entries when %s save without refreshing', (_, first) => {
    const { store, saved } = sharedStore();
    const tabA = openLogState(store, TODAY);
    const tabB = openLogState(store, TODAY);
    const [earlier, later] = first === 'A' ? [tabA, tabB] : [tabB, tabA];

    const one = add(earlier, nov2);
    // The later tab still shows the empty log it opened with.
    expect(later.entries).toEqual([]);
    const two = add(later, nov3);

    expect(one.result.ok && two.result.ok).toBe(true);
    expect(saved()).toEqual({ entries: [nov2, nov3], revision: 2 });
    expect(two.state.entries).toEqual([nov2, nov3]);
    expect(two.state.revision).toBe(2);
  });

  it('does not bring back an entry another tab deleted', () => {
    const { store, saved } = sharedStore({ [LOG_STORAGE_KEY]: serializeStored([nov2, nov3], 5) });
    const tabA = openLogState(store, TODAY);
    const tabB = openLogState(store, TODAY);
    expect(tabA.revision).toBe(5);

    commitLog(tabB, (current) => deleteEntry(current, nov2.date), TODAY);
    const nov4: LogEntry = { date: '2026-11-04', intakeKcal: 1900 };
    add(tabA, nov4);

    expect(saved()).toEqual({ entries: [nov3, nov4], revision: 7 });
  });

  it('refreshes a tab to another tab’s save', () => {
    const { store } = sharedStore();
    const tabA = openLogState(store, TODAY);
    const tabB = openLogState(store, TODAY);
    add(tabB, nov3);

    const refreshed = refreshLog(tabA, TODAY);
    expect(refreshed.entries).toEqual([nov3]);
    expect(refreshed.revision).toBe(1);
    expect(refreshed.store).toBe(store);
  });

  it('turns down an edit to an entry another tab deleted, and shows the latest log', () => {
    const { store, saved } = sharedStore({ [LOG_STORAGE_KEY]: serializeStored([nov2, nov3], 1) });
    const tabA = openLogState(store, TODAY);
    const tabB = openLogState(store, TODAY);
    commitLog(tabB, (current) => deleteEntry(current, nov2.date), TODAY);

    const edited = commitLog(tabA, (current) => updateEntry(current, nov2.date, { ...nov2, weightKg: 79 }), TODAY);
    expect(edited.result).toMatchObject({ ok: false, error: expect.stringMatching(/no entry for 2026-11-02/) });
    expect(edited.state.entries).toEqual([nov3]);
    expect(saved()).toEqual({ entries: [nov3], revision: 2 });
  });

  it('stops saving, without overwriting, when another tab saves a log this page cannot read', () => {
    const newer = JSON.stringify({ format: LOG_FORMAT, version: 2, days: [] });
    const { store, data } = sharedStore();
    const tabA = openLogState(store, TODAY);
    const tabB = openLogState(store, TODAY);
    data.set(LOG_STORAGE_KEY, newer);

    const committed = add(tabA, nov3);
    expect(committed.result.ok).toBe(true);
    expect(committed.state.entries).toEqual([nov3]);
    expect(committed.state.store).toBeNull();
    expect(committed.state.saveError).toMatch(/cannot read/);
    expect(data.get(LOG_STORAGE_KEY)).toBe(newer);

    // The storage event gets there first in a browser; the outcome is the same.
    const refreshed = refreshLog(tabB, TODAY);
    expect(refreshed.store).toBeNull();
    expect(refreshed.saveError).toMatch(/cannot read/);
  });

  it('keeps a change it could not save in this tab only, and stops writing', () => {
    const { store, saved, failWrites } = sharedStore({ [LOG_STORAGE_KEY]: serializeStored([nov2], 1) });
    const tab = openLogState(store, TODAY);
    failWrites();

    const first = add(tab, nov3);
    expect(first.state.saveError).toMatch(/could not be saved/);
    expect(first.state.store).toBeNull();
    const nov4: LogEntry = { date: '2026-11-04', intakeKcal: 1900 };
    const second = add(first.state, nov4);
    expect(second.state.entries).toEqual([nov2, nov3, nov4]);
    expect(saved()).toEqual({ entries: [nov2], revision: 1 });
  });

  it('replaces an unreadable save it backed up at open, but not one that appears later', () => {
    const { store, data, saved } = sharedStore({ [LOG_STORAGE_KEY]: '{broken' });
    const tab = openLogState(store, TODAY);
    expect(data.get(LOG_BACKUP_KEY)).toBe('{broken');
    expect(tab.discarded).toBe('{broken');

    const first = add(tab, nov2);
    expect(saved()).toEqual({ entries: [nov2], revision: 1 });
    expect(first.state.discarded).toBeNull();

    data.set(LOG_STORAGE_KEY, '{broken again');
    const second = add(first.state, nov3);
    expect(second.state.store).toBeNull();
    expect(data.get(LOG_STORAGE_KEY)).toBe('{broken again');
  });

  it('refuses a change that would stretch the log past the span limit, leaving it as saved', () => {
    const { store, saved } = sharedStore({ [LOG_STORAGE_KEY]: serializeStored([nov3], 1) });
    const tab = openLogState(store, TODAY);
    const committed = add(tab, { date: addDays(nov3.date, -3653), weightKg: 80 });
    expect(committed.result).toMatchObject({ ok: false, error: expect.stringMatching(/at most 3,653 days/) });
    expect(saved()).toEqual({ entries: [nov3], revision: 1 });
  });

  it('counts revisions from 0 for a save made before revisions existed', () => {
    const { store, saved } = sharedStore({ [LOG_STORAGE_KEY]: serializeStored([nov2]) });
    const tab = openLogState(store, TODAY);
    expect(tab.revision).toBe(0);
    add(tab, nov3);
    expect(saved().revision).toBe(1);
  });
});
