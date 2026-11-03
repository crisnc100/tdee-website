// CI gate: a smaller seeded cohort than `npm run calibrate`, checked against
// fixed thresholds. The simulator is richer than the filter (see sim.ts), so
// these pass under misspecification, not on the model's own assumptions.
//
// Coverage tolerance: at most 6 points under nominal, at most 12 points over.
// With 2000 people a coverage share has a Monte Carlo SD of at most 1.1 points
// (1000 people: 1.6), so 6 points leaves room for sampling noise plus a little
// misspecification. Under-coverage (overconfident bands) is the failure that
// matters. The filter is tuned to err conservative under misspecification, so
// over-coverage gets a looser bound, and a separate check stops the bands from
// staying uselessly wide.
//
// Why days 7-28 of the realistic cohort are not held to nominal: until the data
// dominate, the bands are the formula prior's, and the prior is centred on the
// formula TDEE while the truth is expenditure AS LOGGED. Simulated users
// under-log by about 8% on average, so the prior sits roughly 170 kcal high and
// its 50% band covers only about 40%. The engine cannot learn that offset
// faster than the data allow; the gate instead requires that the engine never
// covers worse than the prior alone, and the accurate-logger cohort (same
// people, honest logs) shows the filter itself is calibrated.

import { describe, expect, it } from 'vitest';
import committed from './calibration.json';
import { CHECKPOINT_DAYS, HORIZON_DAYS, SCENARIOS, SCHEMA_VERSION, runCalibration, type CalibrationReport } from './calibration';
import { LEVELS, NOMINAL, type CheckpointMetrics, type CohortMetrics } from './metrics';
import { DEFAULT_PARAMS } from './model';

const UNDER_TOLERANCE = 0.06;
const OVER_TOLERANCE = 0.12;
const PRIOR_SLACK = 0.03;

const report = runCalibration({ seed: 7, people: 2000, edgePeople: 1000 });

function at(cohort: CohortMetrics, day: number): CheckpointMetrics {
  const checkpoint = cohort.checkpoints.find((c) => c.day === day);
  if (!checkpoint) throw new Error(`no checkpoint for day ${day}`);
  return checkpoint;
}

function expectHonestCoverage(cohort: CohortMetrics, day: number, { boundOver = true } = {}): void {
  const { coverage } = at(cohort, day);
  for (const level of LEVELS) {
    expect(coverage[level], `${level} at day ${day}`).toBeGreaterThanOrEqual(NOMINAL[level] - UNDER_TOLERANCE);
    if (boundOver) expect(coverage[level], `${level} at day ${day}`).toBeLessThanOrEqual(NOMINAL[level] + OVER_TOLERANCE);
  }
}

describe('calibration gate', () => {
  it('never produces a non-finite estimate', () => {
    for (const scenario of SCENARIOS) expect(report.cohorts[scenario].nonFiniteValues, scenario).toBe(0);
  });

  it('realistic cohort: bands are honest at day 56, and have narrowed', () => {
    expectHonestCoverage(report.cohorts.realistic, 56);
    const day7Sd = at(report.cohorts.realistic, 7).medianPosteriorSdKcal; // still about the prior SD
    expect(at(report.cohorts.realistic, 56).medianPosteriorSdKcal).toBeLessThan(day7Sd / 2);
  });

  it('realistic cohort: the engine never covers worse than the formula prior alone', () => {
    for (const c of report.cohorts.realistic.checkpoints) {
      for (const level of LEVELS) {
        expect(c.coverage[level], `${level} at day ${c.day}`).toBeGreaterThanOrEqual(c.formulaCoverage[level] - PRIOR_SLACK);
      }
    }
  });

  it('accurate loggers: bands are honest once data arrive (days 28 and 56)', () => {
    expectHonestCoverage(report.cohorts.accurateLogger, 28);
    expectHonestCoverage(report.cohorts.accurateLogger, 56);
  });

  it('realistic cohort: beats the formula by day 28 and halves its error by day 56', () => {
    const d28 = at(report.cohorts.realistic, 28).medianAbsErrorKcal;
    const d56 = at(report.cohorts.realistic, 56).medianAbsErrorKcal;
    expect(d28.engine).toBeLessThan(d28.formula);
    expect(d56.engine).toBeLessThan(d56.formula / 2);
  });

  // Over-coverage is not bounded here: a maintainer's expenditure does not adapt,
  // so the random-walk allowance meant for dieters leaves their bands wide.
  it('edge cohorts: missing weeks and maintainers converge without overconfidence', () => {
    for (const scenario of ['missingWeeks', 'maintainer'] as const) {
      const cohort = report.cohorts[scenario];
      expectHonestCoverage(cohort, 56, { boundOver: false });
      const d56 = at(cohort, 56).medianAbsErrorKcal;
      expect(d56.engine, scenario).toBeLessThan(d56.formula / 2);
    }
  });

  it('edge cohort: with no intake logged, the engine stays exactly on the prior', () => {
    for (const c of report.cohorts.noLogs.checkpoints) {
      expect(c.medianAbsErrorKcal.engine).toBeCloseTo(c.medianAbsErrorKcal.formula, 6);
      expect(c.meanErrorKcal.engine).toBeCloseTo(c.meanErrorKcal.formula, 6);
    }
  });

  it('is deterministic for a seed', () => {
    const small = { seed: 11, people: 40, edgePeople: 10 };
    expect(runCalibration(small)).toEqual(runCalibration(small));
    expect(runCalibration(small)).not.toEqual(runCalibration({ ...small, seed: 12 }));
  });
});

describe('committed calibration.json', () => {
  const file = committed as unknown as CalibrationReport;

  it('matches the current schema and configuration', () => {
    expect(file.schemaVersion).toBe(SCHEMA_VERSION);
    expect(file.config.horizonDays).toBe(HORIZON_DAYS);
    expect(file.config.checkpointDays).toEqual([...CHECKPOINT_DAYS]);
    expect(file.config.engineParams).toEqual(DEFAULT_PARAMS); // regenerate after any tuning
    expect(Object.keys(file.cohorts)).toEqual([...SCENARIOS]);
    for (const scenario of SCENARIOS) {
      const cohort = file.cohorts[scenario];
      expect(cohort.people).toBe(file.config.people[scenario]);
      expect(cohort.checkpoints.map((c) => c.day)).toEqual([...CHECKPOINT_DAYS]);
      expect(cohort.daily.medianAbsErrorKcal.engine).toHaveLength(HORIZON_DAYS + 1);
      expect(cohort.nonFiniteValues).toBe(0);
    }
  });
});
