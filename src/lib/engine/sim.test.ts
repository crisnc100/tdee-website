import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { calculateTDEE } from '../calculator';
import { createRng, deriveSeed } from './prng';
import { simulatePerson } from './sim';

describe('prng', () => {
  it('is uniform on [0, 1) with sane normal moments', () => {
    const rng = createRng(1);
    const u = Array.from({ length: 20000 }, () => rng.next());
    expect(Math.min(...u)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...u)).toBeLessThan(1);
    const z = Array.from({ length: 20000 }, () => rng.normal());
    const mean = z.reduce((a, b) => a + b, 0) / z.length;
    const variance = z.reduce((a, b) => a + (b - mean) ** 2, 0) / z.length;
    expect(Math.abs(mean)).toBeLessThan(0.03);
    expect(Math.abs(variance - 1)).toBeLessThan(0.05);
  });

  it('derives distinct streams', () => {
    const seeds = new Set(Array.from({ length: 1000 }, (_, i) => deriveSeed(42, i)));
    expect(seeds.size).toBe(1000);
  });
});

describe('simulatePerson', () => {
  it('gives the same person for the same seed', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 32 - 1 }), (seed) => {
        expect(simulatePerson(seed, 'realistic', 30)).toEqual(simulatePerson(seed, 'realistic', 30));
      }),
      { seed: 20261103, numRuns: 100 },
    );
  });

  it('gives different people for different seeds', () => {
    expect(simulatePerson(1, 'realistic', 30)).not.toEqual(simulatePerson(2, 'realistic', 30));
  });

  it('builds a valid calculator user and uses the formula as the prior', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const person = simulatePerson(seed, 'realistic', 56);
      expect(person.formulaTdeeKcal).toBe(calculateTDEE(person.userData).tdee);
      expect(person.prior.expenditureKcal).toBe(person.formulaTdeeKcal);
      expect(person.days).toHaveLength(57);
      expect(person.expenditureAsLoggedKcal).toHaveLength(57);
      expect(person.expenditureAsLoggedKcal.every(Number.isFinite)).toBe(true);
    }
  });

  it('scores accurate loggers against true expenditure (no logging gap)', () => {
    expect(simulatePerson(3, 'accurateLogger', 56).meanLoggingGapKcal).toBeCloseTo(0, 9);
  });

  it('never logs intake in the no-logs cohort, and blanks days 14-27 in the missing-weeks cohort', () => {
    expect(simulatePerson(4, 'noLogs', 56).days.every((d) => d.intakeKcal === undefined)).toBe(true);
    const gap = simulatePerson(5, 'missingWeeks', 56).days.slice(14, 28);
    expect(gap.every((d) => d.weightKg === undefined && d.intakeKcal === undefined)).toBe(true);
  });

  it('keeps a maintainer on average at constant weight', () => {
    // Mean drift over many maintainers is close to zero: they eat at true expenditure.
    const drifts = Array.from({ length: 200 }, (_, seed) => {
      const weights = simulatePerson(seed, 'maintainer', 56).days.map((d) => d.weightKg).filter((w): w is number => w !== undefined);
      return weights.slice(-10).reduce((a, b) => a + b, 0) / 10 - weights.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    });
    const median = [...drifts].sort((a, b) => a - b)[100];
    expect(Math.abs(median)).toBeLessThan(0.5);
  });
});
