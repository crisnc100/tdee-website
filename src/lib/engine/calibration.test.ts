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
// dominate, the bands are the prior's. The formula predicts true TDEE while the
// engine estimates expenditure AS LOGGED, which also absorbs an unknown logging
// bias, so the prior is widened and modestly recentred (model.ts). The gate
// requires that the engine is never further from nominal coverage than the
// prior alone (plus 3 points), and the accurate-logger cohort (same people,
// honest logs) shows the filter itself is calibrated. Early coverage of the
// prior itself is gated across a sweep of mean logging bias from 0 to 15%:
// see the sweep block below, and README for the 20% level.
//
// Two baselines: `formula` is the raw calculator TDEE, `prior` is the engine's
// prior mean and interval. Error-reduction claims are measured against the raw
// formula; only checks about the prior itself read `prior`.

import { describe, expect, it } from 'vitest';
import committed from './calibration.json';
import {
  CHECKPOINT_DAYS,
  HORIZON_DAYS,
  SCENARIOS,
  SCHEMA_VERSION,
  SWEEP_BIAS_MEANS,
  runCalibration,
  runSweep,
  type CalibrationReport,
} from './calibration';
import { LEVELS, NOMINAL, type CheckpointMetrics, type CohortMetrics, type Level } from './metrics';
import { DEFAULT_PARAMS, DEFAULT_PRIOR_VARIANT, PRIOR_VARIANTS } from './model';

const UNDER_TOLERANCE = 0.06;
const OVER_TOLERANCE = 0.12;
const PRIOR_SLACK = 0.03;

const report = runCalibration({ seed: 7, people: 2000, edgePeople: 1000 });

function at(cohort: CohortMetrics, day: number): CheckpointMetrics {
  const checkpoint = cohort.checkpoints.find((c) => c.day === day);
  if (!checkpoint) throw new Error(`no checkpoint for day ${day}`);
  return checkpoint;
}

interface PriorBaseline {
  coverage: Record<Level, number>;
  medianAbsErrorKcal: number;
  meanErrorKcal: number;
}

// Schema v1 reported one baseline: the prior, centred on the formula TDEE, as
// `formula` / `formulaCoverage`. From v2 the prior is reported separately as
// `prior` / `priorCoverage`, and must be present.
function priorBaseline(checkpoint: CheckpointMetrics): PriorBaseline {
  const c = checkpoint as unknown as {
    formulaCoverage?: Record<Level, number>;
    priorCoverage?: Record<Level, number>;
    medianAbsErrorKcal: { formula: number; prior?: number };
    meanErrorKcal: { formula: number; prior?: number };
  };
  if (SCHEMA_VERSION < 2) {
    if (!c.formulaCoverage) throw new Error(`no prior coverage at day ${checkpoint.day}`);
    return { coverage: c.formulaCoverage, medianAbsErrorKcal: c.medianAbsErrorKcal.formula, meanErrorKcal: c.meanErrorKcal.formula };
  }
  const { priorCoverage } = c;
  const mae = c.medianAbsErrorKcal.prior;
  const meanError = c.meanErrorKcal.prior;
  if (!priorCoverage || mae === undefined || meanError === undefined) throw new Error(`no prior baseline at day ${checkpoint.day}`);
  return { coverage: priorCoverage, medianAbsErrorKcal: mae, meanErrorKcal: meanError };
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

  it('realistic cohort: the engine is never further from nominal coverage than the prior alone', () => {
    for (const c of report.cohorts.realistic.checkpoints) {
      const prior = priorBaseline(c);
      for (const level of LEVELS) {
        const engineDistance = Math.abs(c.coverage[level] - NOMINAL[level]);
        const priorDistance = Math.abs(prior.coverage[level] - NOMINAL[level]);
        expect(engineDistance, `${level} at day ${c.day}`).toBeLessThanOrEqual(priorDistance + PRIOR_SLACK);
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
      const prior = priorBaseline(c);
      expect(c.medianAbsErrorKcal.engine).toBeCloseTo(prior.medianAbsErrorKcal, 6);
      expect(c.meanErrorKcal.engine).toBeCloseTo(prior.meanErrorKcal, 6);
    }
  });

  it('is deterministic for a seed', () => {
    const small = { seed: 11, people: 40, edgePeople: 10 };
    expect(runCalibration(small)).toEqual(runCalibration(small));
    expect(runCalibration(small)).not.toEqual(runCalibration({ ...small, seed: 12 }));
  });
});

describe('calibration gate: early weeks across logging-bias levels', () => {
  // Mean logging bias 0-15%, the range the chosen prior is expected to handle.
  // 20% is outside the asserted range: its early bands sit at the edge (README).
  const GATED_BIAS_MEANS = SWEEP_BIAS_MEANS.filter((b) => b <= 0.15);
  const sweep = runSweep(7, 1000, [DEFAULT_PRIOR_VARIANT])[DEFAULT_PRIOR_VARIANT];
  if (!sweep) throw new Error('sweep did not run');

  // Under-coverage only. A prior that must allow for any bias in this range is
  // wider than needed at any single level, so mid-range cohorts over-cover early
  // (about +19 points on the 50% interval at 10% bias). That is the cost of not
  // knowing the bias, not overconfidence; the over bound is not applied here.
  it.each(GATED_BIAS_MEANS)('mean bias %s: days 7 and 14 are not overconfident', (bias) => {
    const level = sweep.levels.find((l) => l.loggingBiasMean === bias);
    if (!level) throw new Error(`no sweep level ${bias}`);
    for (const day of [7, 14]) {
      const c = level.checkpoints.find((x) => x.day === day);
      if (!c) throw new Error(`no checkpoint ${day}`);
      for (const lv of LEVELS) {
        expect(c.coverage[lv], `${lv} at day ${day}`).toBeGreaterThanOrEqual(NOMINAL[lv] - UNDER_TOLERANCE);
      }
    }
  });

  it('every sweep level is honest by day 56', () => {
    for (const level of sweep.levels) {
      const c = level.checkpoints.find((x) => x.day === 56);
      if (!c) throw new Error('no day-56 checkpoint');
      for (const lv of LEVELS) {
        expect(c.coverage[lv], `${lv} at bias ${level.loggingBiasMean}`).toBeGreaterThanOrEqual(NOMINAL[lv] - UNDER_TOLERANCE);
        expect(c.coverage[lv], `${lv} at bias ${level.loggingBiasMean}`).toBeLessThanOrEqual(NOMINAL[lv] + OVER_TOLERANCE);
      }
    }
  });
});

describe('committed calibration.json', () => {
  const file = committed as unknown as CalibrationReport;

  it('matches the current schema and configuration', () => {
    expect(file.schemaVersion).toBe(SCHEMA_VERSION);
    expect(file.config.horizonDays).toBe(HORIZON_DAYS);
    expect(file.config.checkpointDays).toEqual([...CHECKPOINT_DAYS]);
    expect(file.config.engineParams).toEqual(DEFAULT_PARAMS); // regenerate after any tuning
    expect(file.config.priorVariant).toBe(DEFAULT_PRIOR_VARIANT);
    expect(file.config.prior).toEqual(PRIOR_VARIANTS[DEFAULT_PRIOR_VARIANT]);
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

describe('committed sweep', () => {
  const file = committed as unknown as CalibrationReport;

  it('covers every bias level for both prior variants, and the default is the better worst case', () => {
    const variants = Object.keys(PRIOR_VARIANTS) as (keyof typeof PRIOR_VARIANTS)[];
    for (const v of variants) {
      expect(file.sweep.variants[v]?.levels.map((l) => l.loggingBiasMean)).toEqual([...SWEEP_BIAS_MEANS]);
    }
    const worst = (v: keyof typeof PRIOR_VARIANTS) => file.sweep.variants[v]?.worstCoverageDeviation ?? Infinity;
    const best = variants.reduce((a, b) => (worst(b) < worst(a) ? b : a));
    expect(best).toBe(DEFAULT_PRIOR_VARIANT);
  });
});
