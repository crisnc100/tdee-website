import type { ReactNode } from 'react';

// Small pieces shared by the Track tab and the result hero.

export const primaryButton =
  'min-h-11 px-4 bg-accent text-accent-foreground border border-accent-ink rounded-[3px] inline-flex items-center justify-center gap-2 label-caps hover:brightness-105 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';
export const secondaryButton =
  'min-h-11 px-4 border border-input rounded-[3px] text-foreground hover:bg-muted hover:border-foreground transition-colors inline-flex items-center justify-center gap-2 label-caps cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-input';
export const iconButton =
  'w-11 h-11 shrink-0 inline-flex items-center justify-center rounded-[2px] border border-transparent text-muted-foreground hover:text-foreground hover:border-input transition-colors cursor-pointer';
export const labelClass = 'label-caps block text-foreground mb-2';
export const hintClass = 'mt-1.5 text-xs text-muted-foreground';
export const errorClass = 'mt-1.5 text-sm text-danger';
// Inputs beside a unit cell lose their right-hand corners; focus lifts them above the cell.
export const groupedFieldClass = 'field relative focus:z-10 rounded-r-none min-w-0';

export function UnitCell({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center shrink-0 px-3 border border-l-0 border-input bg-muted label-caps text-muted-foreground rounded-r-[2px]"
    >
      {children}
    </span>
  );
}

export function kcal(value: number): string {
  return Math.round(value).toLocaleString();
}

/** "Mon, Nov 3" for an ISO day, independent of the device's time zone. */
export function formatDay(isoDay: string, withYear = false): string {
  const [y, m, d] = isoDay.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

/** Half-width of the 80% credible interval, the band the UI quotes as "±". */
export function band80(estimate: { intervals: { p80: { lower: number; upper: number } } }): number {
  return (estimate.intervals.p80.upper - estimate.intervals.p80.lower) / 2;
}
