import { describe, expect, it } from 'vitest';
import { calculateTDEE } from '../calculator';
import type { UserData } from '../../types/calculator';
import { advanceDay, createEngine, expenditureOf, observeWeight, runEngine } from './filter';
import { DEFAULT_PARAMS, E, KCAL_PER_KG, PRIOR_RELATIVE_SD, priorFromFormula, priorFromUserData, type DayLog } from './model';

const PRIOR = priorFromFormula(2500, 80);

/** A noise-free user who logs `intake` daily and whose weight follows that intake against `expenditure`. */
function exactDays(count: number, intake: number, expenditure: number, startKg = 80): DayLog[] {
  return Array.from({ length: count }, (_, day) => ({
    weightKg: startKg + (day * (intake - expenditure)) / KCAL_PER_KG,
    intakeKcal: intake,
  }));
}

describe('priors', () => {
  const user: UserData = {
    age: 30, gender: 'male', units: 'metric', weight: 80, height: 180,
    jobActivity: 'desk', steps: 0, calculatorMode: 'simple', simpleExerciseLevel: 'none',
  };

  it('uses the frozen formula TDEE as the mean and a fixed 10% SD', () => {
    const prior = priorFromUserData(user);
    expect(prior.expenditureKcal).toBe(calculateTDEE(user).tdee);
    expect(prior.expenditureSdKcal).toBeCloseTo(PRIOR_RELATIVE_SD * prior.expenditureKcal, 9);
    expect(prior.weightKg).toBe(80);
  });

  it('ignores the error-margin slider', () => {
    const a = priorFromUserData({ ...user, errorMarginPreference: 3 });
    const b = priorFromUserData({ ...user, errorMarginPreference: 12 });
    expect(a).toEqual(b);
  });

  it('converts imperial weight to kg', () => {
    const prior = priorFromUserData({ ...user, units: 'imperial', weight: 176.37, height: 70.87 });
    expect(prior.weightKg).toBeCloseTo(80, 1);
  });

  it('rejects a non-finite or non-positive prior', () => {
    expect(() => createEngine({ ...PRIOR, expenditureKcal: Number.NaN })).toThrow(RangeError);
    expect(() => createEngine({ ...PRIOR, expenditureSdKcal: 0 })).toThrow(RangeError);
    expect(() => createEngine({ ...PRIOR, weightKg: -1 })).toThrow(RangeError);
  });
});

describe('runEngine', () => {
  it('exposes the formula prior unchanged next to the posterior', () => {
    const run = runEngine(PRIOR, exactDays(30, 2000, 2400));
    expect(run.prior.mean).toBe(2500);
    expect(run.prior.sd).toBe(250);
    expect(run.days).toHaveLength(30);
    expect(run.days[29].expenditure.mean).not.toBe(2500);
  });

  it('recovers expenditure as logged from a clean weight trend', () => {
    const run = runEngine(PRIOR, exactDays(120, 2000, 2400));
    const last = run.days[119].expenditure;
    expect(Math.abs(last.mean - 2400)).toBeLessThan(40);
    expect(last.sd).toBeLessThan(run.prior.sd / 3);
  });

  it('moves toward the truth from either side of the prior', () => {
    const low = runEngine(priorFromFormula(2000, 80), exactDays(56, 2200, 2400)).days[55].expenditure.mean;
    const high = runEngine(priorFromFormula(2900, 80), exactDays(56, 2200, 2400)).days[55].expenditure.mean;
    expect(low).toBeGreaterThan(2000);
    expect(high).toBeLessThan(2900);
    expect(Math.abs(low - 2400)).toBeLessThan(100);
    expect(Math.abs(high - 2400)).toBeLessThan(100);
  });

  it('reports nested, ordered intervals around the mean', () => {
    const { mean, intervals } = runEngine(PRIOR, exactDays(10, 2000, 2400)).days[9].expenditure;
    expect(intervals.p95.lower).toBeLessThan(intervals.p80.lower);
    expect(intervals.p80.lower).toBeLessThan(intervals.p50.lower);
    expect(intervals.p50.lower).toBeLessThan(mean);
    expect(intervals.p50.upper).toBeGreaterThan(mean);
    expect(intervals.p80.upper).toBeLessThan(intervals.p95.upper);
  });

  it('is deterministic', () => {
    const days = exactDays(40, 2100, 2300);
    expect(runEngine(PRIOR, days)).toEqual(runEngine(PRIOR, days));
  });
});

describe('missing data', () => {
  it('predicts only on a day without a weigh-in', () => {
    const start = createEngine(PRIOR);
    const { state, status } = observeWeight(start, undefined);
    expect(status).toBe('missing');
    expect(state).toBe(start);
  });

  it('treats implausible values as missing', () => {
    const start = createEngine(PRIOR);
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -5, 0, 1e9, null]) {
      expect(observeWeight(start, bad).status).toBe('missing');
    }
    for (const bad of [Number.NaN, Number.NEGATIVE_INFINITY, -100, 1e7, null]) {
      expect(advanceDay(start, bad).status).toBe('unanchored');
    }
  });

  it('carries no information about expenditure before the first logged intake', () => {
    const run = runEngine(PRIOR, Array.from({ length: 30 }, (_, day) => ({ weightKg: 80 - day * 0.1 })));
    expect(run.days.every((d) => d.intake === 'unanchored')).toBe(true);
    expect(run.days[29].expenditure.mean).toBeCloseTo(PRIOR.expenditureKcal, 6);
  });

  it('imputes unlogged days from recent logs with a wide SD', () => {
    let state = createEngine(PRIOR);
    state = advanceDay(state, 1800).state;
    state = advanceDay(state, 2200).state;
    const imputed = advanceDay(state, undefined);
    expect(imputed.status).toBe('imputed');
    expect(state.intakeAverage).toBe(2000);
    const logged = advanceDay(state, 2000);
    const extraVariance = imputed.state.cov[0][0] - logged.state.cov[0][0];
    expect(extraVariance).toBeCloseTo((DEFAULT_PARAMS.missingIntakeSdKcal / KCAL_PER_KG) ** 2, 9);
    expect(imputed.state.mean).toEqual(logged.state.mean);
  });
});

describe('outliers', () => {
  it('down-weights a single absurd weigh-in and limits its pull on expenditure', () => {
    const clean = exactDays(29, 2000, 2400);
    const spiked = clean.map((d, day) => (day === 20 ? { ...d, weightKg: (d.weightKg as number) + 15 } : d));
    const cleanRun = runEngine(PRIOR, clean);
    const spikedRun = runEngine(PRIOR, spiked);
    expect(spikedRun.days[20].weighIn).toBe('downweighted');
    const shift = Math.abs(spikedRun.days[28].expenditure.mean - cleanRun.days[28].expenditure.mean);
    expect(shift).toBeLessThan(60);
  });

  it('keeps weighing in a lasting shift', () => {
    // A real 3 kg step persists; after a week the trend weight has moved most of the way.
    const days = Array.from({ length: 40 }, (_, day) => ({ weightKg: day < 30 ? 80 : 83, intakeKcal: 2500 }));
    const run = runEngine(PRIOR, days);
    expect(run.days[39].trendWeightKg.mean).toBeGreaterThan(81.5);
  });
});

describe('variance bookkeeping', () => {
  it('adds exactly the drift variance to expenditure each day with no data', () => {
    let state = createEngine(PRIOR);
    for (let day = 0; day < 10; day += 1) state = advanceDay(state, undefined).state;
    const { mean, sd } = expenditureOf(state);
    expect(mean).toBe(PRIOR.expenditureKcal);
    expect(sd ** 2).toBeCloseTo(PRIOR.expenditureSdKcal ** 2 + 10 * DEFAULT_PARAMS.expenditureDriftKcal ** 2, 6);
    expect(state.cov[E][E]).toBeCloseTo(sd ** 2, 9);
  });
});
