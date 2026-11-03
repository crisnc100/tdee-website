import { describe, expect, it } from 'vitest';
import { calculateTDEE } from '../calculator';
import { simulatePerson } from '../engine/sim';
import type { UserData } from '../../types/calculator';
import { checkEntry } from './entries';
import { runLogEngine } from './engine';
import { SAMPLE_DAYS, SAMPLE_SEED, buildSample } from './sample';

const base = { jobActivity: 'desk', steps: 7000, calculatorMode: 'simple', simpleExerciseLevel: 'light' } as const;
const profiles: UserData[] = [
  { ...base, age: 32, gender: 'male', units: 'metric', weight: 84, height: 180 },
  { ...base, age: 45, gender: 'female', units: 'imperial', weight: 165, height: 64, heightFeet: 5, heightInches: 4 },
  { ...base, age: 25, gender: 'female', units: 'metric', weight: 60, height: 165 },
  { ...base, age: 60, gender: 'male', units: 'imperial', weight: 220, height: 70, heightFeet: 5, heightInches: 10 },
];
const today = '2026-11-03';

describe('buildSample', () => {
  it('is deterministic', () => {
    const request = { userData: profiles[0], formulaTdeeKcal: calculateTDEE(profiles[0]).tdee, today };
    expect(buildSample(request)).toEqual(buildSample(request));
  });

  it('uses the user’s own inputs when they reproduce the formula on screen', () => {
    for (const userData of profiles) {
      const sample = buildSample({ userData, formulaTdeeKcal: calculateTDEE(userData).tdee, today });
      expect(sample.matched).toBe(true);
      expect(sample.userData).toEqual(userData);
    }
  });

  it('falls back to the simulator’s own person when the inputs do not match the result', () => {
    const stale = buildSample({ userData: profiles[0], formulaTdeeKcal: calculateTDEE(profiles[0]).tdee + 1, today });
    expect(stale.matched).toBe(false);
    expect(stale.userData).toEqual(simulatePerson(SAMPLE_SEED, 'realistic', SAMPLE_DAYS - 1).userData);
    expect(buildSample({ userData: null, formulaTdeeKcal: 2500, today }).matched).toBe(false);
  });

  it('keeps the seed’s behaviour whatever the inputs: same missing days and the same outlier days', () => {
    const shapes = profiles.map((userData) => {
      const sample = buildSample({ userData, formulaTdeeKcal: calculateTDEE(userData).tdee, today });
      const engine = runLogEngine(sample.entries, { formulaTdeeKcal: calculateTDEE(userData).tdee })!;
      return {
        weighed: sample.entries.filter((e) => e.weightKg !== undefined).map((e) => e.date),
        fed: sample.entries.filter((e) => e.intakeKcal !== undefined).map((e) => e.date),
        outliers: [...engine.outlierDates],
      };
    });
    for (const shape of shapes.slice(1)) expect(shape).toEqual(shapes[0]);
  });

  it('gives eight weeks of valid entries ending today, with truth for every day', () => {
    const sample = buildSample({ userData: profiles[1], formulaTdeeKcal: calculateTDEE(profiles[1]).tdee, today });
    expect(sample.truth).toHaveLength(SAMPLE_DAYS);
    expect(sample.truth[0].date).toBe('2026-09-09');
    expect(sample.truth[SAMPLE_DAYS - 1].date).toBe(today);
    expect(sample.entries[0].date).toBe('2026-09-09');
    expect(sample.entries[sample.entries.length - 1].date).toBe(today);
    for (const entry of sample.entries) expect(checkEntry(entry)).toEqual({ ok: true, value: entry });
    expect(new Set(sample.entries.map((e) => e.date)).size).toBe(sample.entries.length);
  });

  it('demos what the Track tab explains: flagged spikes, under-logging, and a band that narrows around the truth', () => {
    for (const userData of profiles) {
      const formula = calculateTDEE(userData).tdee;
      const sample = buildSample({ userData, formulaTdeeKcal: formula, today });
      const engine = runLogEngine(sample.entries, { formulaTdeeKcal: formula, weightKg: sample.entries[0].weightKg })!;
      const truth = sample.truth[SAMPLE_DAYS - 1].kcal;
      const { mean, intervals, sd } = engine.current.expenditure;
      expect(engine.dayCount).toBe(SAMPLE_DAYS);
      expect(engine.outlierDates.size).toBeGreaterThanOrEqual(1);
      expect(sample.meanLoggingGapKcal).toBeGreaterThan(100);
      expect(truth).toBeGreaterThanOrEqual(intervals.p80.lower);
      expect(truth).toBeLessThanOrEqual(intervals.p80.upper);
      expect(sd).toBeLessThan(engine.prior.sd / 2);
      expect(Math.abs(mean - truth)).toBeLessThan(Math.abs(formula - truth));
    }
  });
});
