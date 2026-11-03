import type { DayPosterior } from '@/lib/engine/model';

/**
 * The lowest and highest values the estimate chart plots: each day's 80% band,
 * the formula and, in sample mode, the true values. A loop rather than
 * Math.min(...values), which throws a RangeError once a log has tens of
 * thousands of days.
 */
export function plottedRange(
  days: readonly DayPosterior[],
  formulaTdee: number,
  truthKcal: readonly number[] = [],
): { lo: number; hi: number } {
  let lo = formulaTdee;
  let hi = formulaTdee;
  for (const day of days) {
    const { lower, upper } = day.expenditure.intervals.p80;
    if (lower < lo) lo = lower;
    if (upper > hi) hi = upper;
  }
  for (const value of truthKcal) {
    if (value < lo) lo = value;
    if (value > hi) hi = value;
  }
  return { lo, hi };
}
