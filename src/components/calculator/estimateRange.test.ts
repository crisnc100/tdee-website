import { describe, expect, it } from 'vitest';
import { gaussianEstimate, type DayPosterior } from '../../lib/engine/model';
import { addDays, type LogEntry } from '../../lib/log/entries';
import { runLogEngine } from '../../lib/log/engine';
import { plottedRange } from './estimateRange';

const day = (i: number, mean: number, sd: number): DayPosterior => ({
  day: i,
  expenditure: gaussianEstimate(mean, sd),
  trendWeightKg: { mean: 80, sd: 0.5 },
  weighIn: 'used',
  intake: 'logged',
});

describe('plottedRange', () => {
  it('matches the band, formula and truth extremes over a 1,200-day engine run', () => {
    const entries: LogEntry[] = Array.from({ length: 1200 }, (_, i) => ({
      date: addDays('2023-01-01', i),
      weightKg: 85 - i * 0.004 + (i % 7) * 0.1,
      intakeKcal: 2200 + (i % 5) * 40,
    }));
    const engine = runLogEngine(entries, { formulaTdeeKcal: 2600, weightKg: 85 });
    expect(engine?.dayCount).toBe(1200);
    if (!engine) return;
    const truth = Array.from({ length: 1200 }, (_, i) => 2300 + (i % 11));
    const values = engine.run.days.flatMap((d) => [d.expenditure.intervals.p80.lower, d.expenditure.intervals.p80.upper]);
    values.push(2600, ...truth);

    expect(plottedRange(engine.run.days, 2600, truth)).toEqual({ lo: Math.min(...values), hi: Math.max(...values) });
  });

  it('handles 200,000 days, more than spreading into Math.min can take', () => {
    const days = Array.from({ length: 200_000 }, (_, i) => day(i, 2400 + (i % 1000), 50));
    const { lo, hi } = plottedRange(days, 2500);
    expect(lo).toBeCloseTo(2400 - 1.2815515655446004 * 50, 6);
    expect(hi).toBeCloseTo(3399 + 1.2815515655446004 * 50, 6);
  });

  it('includes the formula and truth even when they sit outside the band', () => {
    expect(plottedRange([day(0, 2500, 10), day(1, 2500, 10)], 1800, [3200])).toEqual({ lo: 1800, hi: 3200 });
  });
});
