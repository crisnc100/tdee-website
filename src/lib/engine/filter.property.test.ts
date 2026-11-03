import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { advanceDay, createEngine, observeWeight, runEngine, step, type EngineState } from './filter';
import { DEFAULT_PARAMS, E, priorFromFormula, type DayLog } from './model';

const SEED = 20261103;
const RUNS = 200;

const prior = fc.record({
  tdee: fc.double({ min: 1000, max: 5000, noNaN: true }),
  weight: fc.double({ min: 40, max: 200, noNaN: true }),
});

const plausibleDay: fc.Arbitrary<DayLog> = fc.record({
  weightKg: fc.option(fc.double({ min: 40, max: 200, noNaN: true }), { nil: undefined }),
  intakeKcal: fc.option(fc.double({ min: 0, max: 6000, noNaN: true }), { nil: undefined }),
});

const anyNumber = fc.oneof(
  fc.double(), // includes NaN, +/-Infinity, -0 and huge values
  fc.constantFrom(undefined, null, 0, -1, 1e308),
  fc.double({ min: 40, max: 200, noNaN: true }).map((x) => x + 100 * Math.round(Math.sin(x) * 3)), // outliers
);
const anyDay: fc.Arbitrary<DayLog> = fc.record({ weightKg: anyNumber, intakeKcal: anyNumber });

function replay(start: EngineState, days: DayLog[]): EngineState {
  return days.reduce((state, day) => step(state, day).state, start);
}

describe('engine properties', () => {
  it('a valid weigh-in never increases the posterior variance of expenditure', () => {
    fc.assert(
      fc.property(prior, fc.array(plausibleDay, { maxLength: 60 }), fc.double({ min: 25, max: 350, noNaN: true }), (p, history, weight) => {
        const before = replay(createEngine(priorFromFormula(p.tdee, p.weight)), history);
        const after = observeWeight(before, weight).state;
        expect(after.cov[E][E]).toBeLessThanOrEqual(before.cov[E][E] * (1 + 1e-12));
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });

  it('stays finite on arbitrary inputs, including gaps, outliers and garbage', () => {
    fc.assert(
      fc.property(prior, fc.array(anyDay, { maxLength: 120 }), (p, days) => {
        const run = runEngine(priorFromFormula(p.tdee, p.weight), days);
        for (const d of run.days) {
          const values = [
            d.expenditure.mean, d.expenditure.sd, d.trendWeightKg.mean, d.trendWeightKg.sd,
            ...Object.values(d.expenditure.intervals).flatMap((i) => [i.lower, i.upper]),
          ];
          expect(values.every(Number.isFinite)).toBe(true);
          expect(d.expenditure.sd).toBeGreaterThan(0);
        }
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });

  it('is a pure function of its inputs', () => {
    fc.assert(
      fc.property(prior, fc.array(anyDay, { maxLength: 60 }), (p, days) => {
        const a = runEngine(priorFromFormula(p.tdee, p.weight), days);
        const b = runEngine(priorFromFormula(p.tdee, p.weight), structuredClone(days));
        expect(a).toEqual(b);
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });

  it('with no observations, the posterior is the prior evolved by the random walk', () => {
    fc.assert(
      fc.property(prior, fc.integer({ min: 1, max: 365 }), (p, length) => {
        const pr = priorFromFormula(p.tdee, p.weight);
        const run = runEngine(pr, Array.from({ length }, () => ({})));
        run.days.forEach((d, day) => {
          expect(d.expenditure.mean).toBe(pr.expenditureKcal);
          const expectedVariance = pr.expenditureSdKcal ** 2 + day * DEFAULT_PARAMS.expenditureDriftKcal ** 2;
          expect(d.expenditure.sd ** 2).toBeCloseTo(expectedVariance, 6);
        });
      }),
      { seed: SEED, numRuns: 100 },
    );
  });

  it('a day without data never decreases uncertainty', () => {
    fc.assert(
      fc.property(prior, fc.array(plausibleDay, { maxLength: 60 }), (p, history) => {
        const before = replay(createEngine(priorFromFormula(p.tdee, p.weight)), history);
        const after = advanceDay(observeWeight(before, undefined).state, undefined).state;
        expect(after.cov[E][E]).toBeGreaterThanOrEqual(before.cov[E][E]);
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });
});
