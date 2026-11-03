// Test helpers shared by the cross-tab tests; not imported by the app.

import type { LogLocks } from './crossTab';

/** A lock manager that grants each name to one caller at a time, in request order, like navigator.locks. */
export function fakeLocks() {
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
