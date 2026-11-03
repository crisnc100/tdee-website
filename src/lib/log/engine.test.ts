import { describe, expect, it } from 'vitest';
import { runEngine } from '../engine/filter';
import { expenditureAsLoggedPrior, priorFromFormula } from '../engine/model';
import { addDays, type LogEntry } from './entries';
import { logEnginePrior, runLogEngine, toEngineDays } from './engine';

const input = { formulaTdeeKcal: 2600, weightKg: 82 };

/** A slow loser: 20 g down a day on 2,100 kcal logged, with a little scale noise. */
function steadyLog(days: number, start = '2026-01-01'): LogEntry[] {
  return Array.from({ length: days }, (_, i) => ({
    date: addDays(start, i),
    weightKg: Math.round((82 - 0.02 * i + 0.2 * Math.sin(i * 1.7)) * 10) / 10,
    intakeKcal: 2100,
  }));
}

describe('toEngineDays', () => {
  it('fills missing dates with empty days, in date order', () => {
    const mapped = toEngineDays([
      { date: '2026-11-04', intakeKcal: 2000 },
      { date: '2026-11-01', weightKg: 80 },
    ]);
    expect(mapped).toEqual({
      startDate: '2026-11-01',
      days: [
        { weightKg: 80, intakeKcal: undefined },
        {},
        {},
        { weightKg: undefined, intakeKcal: 2000 },
      ],
    });
  });

  it('returns null for an empty log', () => {
    expect(toEngineDays([])).toBeNull();
    expect(runLogEngine([], input)).toBeNull();
  });
});

describe('runLogEngine', () => {
  it('starts from the formula recentred for under-logging, as the engine prescribes', () => {
    expect(logEnginePrior([], input)).toEqual(expenditureAsLoggedPrior(priorFromFormula(2600, 82)));
    expect(logEnginePrior([{ date: '2026-11-01', weightKg: 90 }], { formulaTdeeKcal: 2600 }).weightKg).toBe(90);
  });

  it('gives exactly what the engine gives on the same days', () => {
    const entries = steadyLog(40);
    const result = runLogEngine(entries, input)!;
    const direct = runEngine(logEnginePrior(entries, input), toEngineDays(entries)!.days);
    expect(result.run).toEqual(direct);
    expect(result.current).toEqual(direct.days[39]);
    expect(result.dayCount).toBe(40);
    expect(result.startDate).toBe('2026-01-01');
  });

  it('flags the dates of weigh-ins the engine down-weighted', () => {
    const entries = steadyLog(30);
    entries[20] = { ...entries[20], weightKg: entries[20].weightKg! + 8 }; // a typo
    const result = runLogEngine(entries, input)!;
    expect(result.outlierDates.has(entries[20].date)).toBe(true);
    for (const posterior of result.run.days) {
      expect(result.outlierDates.has(addDays(result.startDate, posterior.day))).toBe(posterior.weighIn === 'downweighted');
    }
  });

  it('says it is still on the prior until a weigh-in, a fed day and a later weigh-in', () => {
    const weightsOnly = steadyLog(10).map(({ date, weightKg }) => ({ date, weightKg }));
    expect(runLogEngine(weightsOnly, input)!.learning).toBe(false);
    const caloriesOnly = steadyLog(10).map(({ date, intakeKcal }) => ({ date, intakeKcal }));
    expect(runLogEngine(caloriesOnly, input)!.learning).toBe(false);
    expect(runLogEngine([{ date: '2026-11-01', intakeKcal: 2000 }, { date: '2026-11-02', weightKg: 80 }], input)!.learning).toBe(false);
    expect(
      runLogEngine([{ date: '2026-11-01', weightKg: 80, intakeKcal: 2000 }, { date: '2026-11-02', weightKg: 79.9 }], input)!.learning,
    ).toBe(true);
  });

  it('counts weigh-ins and logged days', () => {
    const entries = steadyLog(5);
    delete entries[2].weightKg;
    delete entries[3].intakeKcal;
    const result = runLogEngine(entries, input)!;
    expect(result.weighIns).toBe(4);
    expect(result.intakeDays).toBe(4);
  });

  it('narrows the band over a long log and stays finite past a year', () => {
    const result = runLogEngine(steadyLog(3 * 365), input)!;
    expect(result.dayCount).toBe(1095);
    expect(result.current.expenditure.sd).toBeLessThan(result.prior.sd / 3);
    expect(result.run.days.every((d) => Number.isFinite(d.expenditure.mean) && Number.isFinite(d.expenditure.sd))).toBe(true);
  });

  it('runs a year of daily entries fast enough to recompute on every edit', () => {
    const entries = steadyLog(365);
    runLogEngine(entries, input); // warm up
    const start = performance.now();
    for (let i = 0; i < 10; i += 1) runLogEngine(entries, input);
    const perRunMs = (performance.now() - start) / 10;
    // A loose bound for slow CI machines; locally a run takes a few milliseconds.
    expect(perRunMs).toBeLessThan(100);
  });
});
