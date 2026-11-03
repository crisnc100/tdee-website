import { describe, expect, it } from 'vitest';
import { commitAcrossTabs, type LogTab } from './crossTab';
import { addEntry, mergeEntries, type LogEntry } from './entries';
import { fakeLocks } from './fakeLocks.testkit';
import { createPendingGuard } from './pending';
import { LOG_STORAGE_KEY, loadStored, serializeStored } from './schema';
import { openLogState, type KeyValueStore, type LogState } from './storage';

const TODAY = '2026-11-03';
const today = () => TODAY;
const nov1: LogEntry = { date: '2026-11-01', weightKg: 80.6 };
const nov2: LogEntry = { date: '2026-11-02', weightKg: 80.4 };
const nov3: LogEntry = { date: '2026-11-03', weightKg: 80.1, intakeKcal: 2100 };

function sharedStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const store: KeyValueStore = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
  const saved = () => loadStored(data.get(LOG_STORAGE_KEY) ?? null).entries;
  return { store, saved };
}

function tab(state: LogState): LogTab {
  let current = state;
  return { get: () => current, set: (next) => (current = next) };
}

/** Holds the log's lock until released, the way a slow save in another tab would. */
function holdLock(locks: ReturnType<typeof fakeLocks>['locks']) {
  let release = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  void locks.request(LOG_STORAGE_KEY, () => held);
  return release;
}

describe('createPendingGuard', () => {
  it('turns a second run away while the first is pending, then lets the next one through', async () => {
    const changes: boolean[] = [];
    const guard = createPendingGuard((pending) => changes.push(pending));
    let finish = (_: string) => {};
    let calls = 0;
    const first = guard.run(() => {
      calls += 1;
      return new Promise<string>((resolve) => (finish = resolve));
    });
    expect(guard.pending).toBe(true);

    const second = await guard.run(async () => {
      calls += 1;
      return 'second';
    });
    expect(second).toEqual({ ran: false });
    expect(calls).toBe(1);

    finish('first');
    expect(await first).toEqual({ ran: true, value: 'first' });
    expect(guard.pending).toBe(false);
    expect(changes).toEqual([true, false]);
    expect(await guard.run(async () => 'third')).toEqual({ ran: true, value: 'third' });
  });

  it('clears pending when the task fails', async () => {
    const guard = createPendingGuard();
    await expect(guard.run(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(guard.pending).toBe(false);
  });
});

describe('import commits behind the pending guard', () => {
  it('a second Replace while the first waits for the lock is a no-op, so another tab’s save survives', async () => {
    const { store, saved } = sharedStore({ [LOG_STORAGE_KEY]: serializeStored([nov1], 1) });
    const { locks } = fakeLocks();
    const tabA = tab(openLogState(store, TODAY));
    const tabB = tab(openLogState(store, TODAY));
    const guard = createPendingGuard();
    const replace = () => guard.run(() => commitAcrossTabs(locks, tabA, () => [nov2], today));

    const release = holdLock(locks);
    const first = replace();
    const fromB = commitAcrossTabs(locks, tabB, (current) => addEntry(current, nov3), today);
    const second = replace();
    expect(await second).toEqual({ ran: false });

    release();
    expect(await first).toEqual({ ran: true, value: { ok: true, value: [nov2] } });
    expect(await fromB).toEqual({ ok: true, value: [nov2, nov3] });
    expect(saved()).toEqual([nov2, nov3]);
  });

  it('without the guard, the same clicks erase the other tab’s entry (what the guard prevents)', async () => {
    const { store, saved } = sharedStore({ [LOG_STORAGE_KEY]: serializeStored([nov1], 1) });
    const { locks } = fakeLocks();
    const tabA = tab(openLogState(store, TODAY));
    const tabB = tab(openLogState(store, TODAY));
    const replace = () => commitAcrossTabs(locks, tabA, () => [nov2], today);

    const release = holdLock(locks);
    const queued = [replace(), commitAcrossTabs(locks, tabB, (current) => addEntry(current, nov3), today), replace()];
    release();
    await Promise.all(queued);
    expect(saved()).toEqual([nov2]);
  });

  it('a second Merge while the first is pending is a no-op', async () => {
    const { store, saved } = sharedStore({ [LOG_STORAGE_KEY]: serializeStored([nov1], 1) });
    const { locks } = fakeLocks();
    const tabA = tab(openLogState(store, TODAY));
    const guard = createPendingGuard();
    let runs = 0;
    const merge = () =>
      guard.run(() =>
        commitAcrossTabs(
          locks,
          tabA,
          (current) => {
            runs += 1;
            return mergeEntries(current, [nov2]).entries;
          },
          today,
        ),
      );

    const release = holdLock(locks);
    const first = merge();
    expect(await merge()).toEqual({ ran: false });
    release();
    expect(await first).toEqual({ ran: true, value: { ok: true, value: [nov1, nov2] } });
    expect(runs).toBe(1);
    expect(saved()).toEqual([nov1, nov2]);
  });
});
