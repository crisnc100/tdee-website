// Lets one async task run at a time. A save now waits for the log's lock, so a
// second click or Enter can land while the first is still pending; the guard
// turns it away instead of queuing it to run again later.

export type Guarded<T> = { ran: true; value: T } | { ran: false };

export interface PendingGuard {
  readonly pending: boolean;
  /** Runs `task` unless one is already pending, in which case it does nothing and reports `ran: false`. */
  run<T>(task: () => Promise<T>): Promise<Guarded<T>>;
}

export function createPendingGuard(onChange?: (pending: boolean) => void): PendingGuard {
  let pending = false;
  return {
    get pending() {
      return pending;
    },
    async run<T>(task: () => Promise<T>): Promise<Guarded<T>> {
      if (pending) return { ran: false };
      pending = true;
      onChange?.(true);
      try {
        return { ran: true, value: await task() };
      } finally {
        pending = false;
        onChange?.(false);
      }
    },
  };
}
