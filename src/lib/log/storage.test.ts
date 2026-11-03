import { describe, expect, it } from 'vitest';
import { LOG_BACKUP_KEY, LOG_STORAGE_KEY, serializeStored } from './schema';
import { BLOCKED_STORAGE_NOTICE, openLog, saveLog, type KeyValueStore } from './storage';

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

describe('openLog', () => {
  it('opens an empty log when nothing is saved', () => {
    expect(openLog(memoryStore().store)).toEqual({ entries: [], notice: null, canSave: true });
  });

  it('opens a saved log', () => {
    const { store } = memoryStore({ [LOG_STORAGE_KEY]: serializeStored([{ date: '2026-11-03', intakeKcal: 2000 }]) });
    expect(openLog(store)).toEqual({ entries: [{ date: '2026-11-03', intakeKcal: 2000 }], notice: null, canSave: true });
  });

  it('backs up an unreadable log before starting a new one', () => {
    const { store, data } = memoryStore({ [LOG_STORAGE_KEY]: '{broken' });
    const opened = openLog(store);
    expect(opened.entries).toEqual([]);
    expect(opened.canSave).toBe(true);
    expect(opened.notice).toMatch(LOG_BACKUP_KEY);
    expect(data.get(LOG_BACKUP_KEY)).toBe('{broken');
  });

  it('pauses saving when an unreadable log cannot be backed up', () => {
    const { store, data } = memoryStore({ [LOG_STORAGE_KEY]: '{broken' }, true);
    const opened = openLog(store);
    expect(opened.canSave).toBe(false);
    expect(opened.notice).toMatch(/saving is paused/);
    expect(data.get(LOG_STORAGE_KEY)).toBe('{broken');
  });

  it('reports blocked storage', () => {
    const store: KeyValueStore = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {},
    };
    expect(openLog(store)).toEqual({ entries: [], notice: BLOCKED_STORAGE_NOTICE, canSave: false });
  });
});

describe('saveLog', () => {
  it('saves a log that opens back unchanged', () => {
    const { store } = memoryStore();
    const entries = [{ date: '2026-11-02', weightKg: 80.1 }, { date: '2026-11-03', weightKg: 79.9, intakeKcal: 2100 }];
    expect(saveLog(store, entries)).toBeNull();
    expect(openLog(store).entries).toEqual(entries);
  });

  it('returns a message when the write fails', () => {
    expect(saveLog(memoryStore({}, true).store, [])).toMatch(/could not be saved/);
  });
});
