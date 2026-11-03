import { describe, expect, it } from 'vitest';
import { commitAcrossTabs, LOG_LOADING, type LogLocks, type LogTab } from './crossTab';
import { addEntry, type LogEntry } from './entries';
import { LOG_STORAGE_KEY, loadStored, serializeStored } from './schema';
import { MAX_COMMIT_ATTEMPTS, openLogState, type KeyValueStore, type LogState } from './storage';

const TODAY = '2026-11-03';
const today = () => TODAY;
const nov1: LogEntry = { date: '2026-11-01', weightKg: 80.6 };
const nov2: LogEntry = { date: '2026-11-02', weightKg: 80.4 };
const nov3: LogEntry = { date: '2026-11-03', weightKg: 80.1, intakeKcal: 2100 };

/**
 * One fake localStorage shared by every "tab". `afterRead` runs once, right
 * after the next read of the log returns, which is where another tab's save
 * would land in a real race.
 */
function sharedStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  let afterRead: (() => void) | null = null;
  const writes: string[] = [];
  const store: KeyValueStore = {
    getItem: (key) => {
      const value = data.get(key) ?? null;
      if (key === LOG_STORAGE_KEY && afterRead) {
        const hook = afterRead;
        afterRead = null;
        hook();
      }
      return value;
    },
    setItem: (key, value) => {
      data.set(key, value);
      if (key === LOG_STORAGE_KEY) writes.push(value);
    },
  };
  const saved = () => {
    const loaded = loadStored(data.get(LOG_STORAGE_KEY) ?? null);
    return { entries: loaded.entries, revision: loaded.status === 'ok' ? loaded.revision : undefined };
  };
  return { store, data, writes, saved, onNextRead: (hook: () => void) => (afterRead = hook) };
}

/** A lock manager that grants each name to one caller at a time, in request order, like navigator.locks. */
function fakeLocks() {
  const tails = new Map<string, Promise<unknown>>();
  const names: string[] = [];
  let held = 0;
  let maxHeld = 0;
  const locks: LogLocks = {
    request(name, callback) {
      names.push(name);
      const granted = (tails.get(name) ?? Promise.resolve()).then(async () => {
        held += 1;
        maxHeld = Math.max(maxHeld, held);
        try {
          return await callback();
        } finally {
          held -= 1;
        }
      });
      tails.set(name, granted.catch(() => {}));
      return granted;
    },
  };
  return { locks, names, maxHeld: () => maxHeld };
}

function tab(state: LogState): LogTab & { state: LogState } {
  const t = {
    state,
    get: () => t.state,
    set: (next: LogState) => (t.state = next),
  };
  return t;
}

const adding = (entry: LogEntry) => (current: LogEntry[]) => addEntry(current, entry);

describe('commitAcrossTabs', () => {
  it('with locks, a second tab saving mid-commit waits its turn, and both entries survive', async () => {
    const { store, saved, writes, onNextRead } = sharedStore();
    const { locks, names, maxHeld } = fakeLocks();
    const tabA = tab(openLogState(store, TODAY));
    const tabB = tab(openLogState(store, TODAY));

    let commitB: Promise<unknown> | null = null;
    // Tab B asks to save the moment tab A has read the log.
    onNextRead(() => (commitB = commitAcrossTabs(locks, tabB, adding(nov3), today)));
    const resultA = await commitAcrossTabs(locks, tabA, adding(nov2), today);
    const resultB = await commitB;

    expect(resultA).toEqual({ ok: true, value: [nov2] });
    expect(resultB).toEqual({ ok: true, value: [nov2, nov3] });
    expect(saved()).toEqual({ entries: [nov2, nov3], revision: 2 });
    // A wrote once, then B, which started from A's save: no retry was needed.
    expect(writes.map((raw) => loadStored(raw).entries)).toEqual([[nov2], [nov2, nov3]]);
    expect(names).toEqual([LOG_STORAGE_KEY, LOG_STORAGE_KEY]);
    expect(maxHeld()).toBe(1);
    expect(tabA.state.entries).toEqual([nov2]);
    expect(tabB.state.entries).toEqual([nov2, nov3]);
  });

  it('with locks, re-reads and re-applies when a save that took no lock lands mid-commit', async () => {
    const { store, data, saved, writes, onNextRead } = sharedStore({ [LOG_STORAGE_KEY]: serializeStored([nov1], 4) });
    const { locks } = fakeLocks();
    const tabA = tab(openLogState(store, TODAY));

    // A tab still on an older version of the site saves without the lock.
    onNextRead(() => data.set(LOG_STORAGE_KEY, serializeStored([nov1, nov3], 5)));
    const result = await commitAcrossTabs(locks, tabA, adding(nov2), today);

    expect(result).toEqual({ ok: true, value: [nov1, nov2, nov3] });
    expect(saved()).toEqual({ entries: [nov1, nov2, nov3], revision: 6 });
    expect(writes).toHaveLength(1);
    expect(tabA.state.revision).toBe(6);
  });

  it('gives up without saving when every attempt is overtaken by another save', async () => {
    const { store, data, saved, writes, onNextRead } = sharedStore();
    const { locks } = fakeLocks();
    const tabA = tab(openLogState(store, TODAY));

    // Each attempt reads the log, then checks it before writing. A rival tab
    // saves right after every attempt's first read, so every check fails.
    let reads = 0;
    let calls = 0;
    const rivalSaves = () => {
      reads += 1;
      if (reads % 2 === 1 && reads < 2 * MAX_COMMIT_ATTEMPTS) {
        data.set(LOG_STORAGE_KEY, serializeStored([nov1], reads));
      }
      if (reads < 2 * MAX_COMMIT_ATTEMPTS) onNextRead(rivalSaves);
    };
    onNextRead(rivalSaves);

    const result = await commitAcrossTabs(
      locks,
      tabA,
      (current) => {
        calls += 1;
        return addEntry(current, nov2);
      },
      today,
    );

    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/Try again/) });
    expect(calls).toBe(MAX_COMMIT_ATTEMPTS);
    expect(writes).toEqual([]);
    expect(saved().entries).toEqual([nov1]);
    expect(tabA.state.entries).toEqual([nov1]);
    expect(tabA.state.store).toBe(store);
  });

  it('without locks, catches a save that lands between read and check, and keeps both entries', async () => {
    const { store, saved, onNextRead } = sharedStore();
    const tabA = tab(openLogState(store, TODAY));
    const tabB = tab(openLogState(store, TODAY));

    let resultB: Promise<unknown> | null = null;
    // No lock to wait on: tab B's whole save runs inside tab A's commit.
    onNextRead(() => (resultB = commitAcrossTabs(null, tabB, adding(nov3), today)));
    const resultA = await commitAcrossTabs(null, tabA, adding(nov2), today);

    expect(await resultB).toEqual({ ok: true, value: [nov3] });
    expect(resultA).toEqual({ ok: true, value: [nov2, nov3] });
    expect(saved()).toEqual({ entries: [nov2, nov3], revision: 2 });
  });

  it('without locks, still loses a save that lands between the check and the write (the gap a lock closes)', async () => {
    const { store, data, saved, onNextRead } = sharedStore();
    const tabA = tab(openLogState(store, TODAY));

    // The first read is the commit's read; the second is its check.
    onNextRead(() => onNextRead(() => data.set(LOG_STORAGE_KEY, serializeStored([nov3], 1))));
    const result = await commitAcrossTabs(null, tabA, adding(nov2), today);

    expect(result).toEqual({ ok: true, value: [nov2] });
    expect(saved()).toEqual({ entries: [nov2], revision: 1 });
  });

  it('saves as without locks when the lock cannot be taken', async () => {
    const { store, saved } = sharedStore();
    const tabA = tab(openLogState(store, TODAY));
    const refusing: LogLocks = { request: () => Promise.reject(new DOMException('denied', 'SecurityError')) };

    expect(await commitAcrossTabs(refusing, tabA, adding(nov2), today)).toEqual({ ok: true, value: [nov2] });
    expect(saved()).toEqual({ entries: [nov2], revision: 1 });
  });

  it('runs a tab’s queued commits in order, each from the one before', async () => {
    const { store, saved } = sharedStore();
    const { locks } = fakeLocks();
    const tabA = tab(openLogState(store, TODAY));

    const [one, two] = await Promise.all([
      commitAcrossTabs(locks, tabA, adding(nov2), today),
      commitAcrossTabs(locks, tabA, adding(nov3), today),
    ]);
    expect(one).toEqual({ ok: true, value: [nov2] });
    expect(two).toEqual({ ok: true, value: [nov2, nov3] });
    expect(saved()).toEqual({ entries: [nov2, nov3], revision: 2 });
    expect(tabA.state.revision).toBe(2);
  });

  it('turns a commit down while the log is still loading', async () => {
    const { locks } = fakeLocks();
    const loading: LogTab = { get: () => null, set: () => {} };
    expect(await commitAcrossTabs(locks, loading, adding(nov2), today)).toBe(LOG_LOADING);
  });
});
