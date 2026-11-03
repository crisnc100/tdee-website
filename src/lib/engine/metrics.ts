// Scoring of engine runs against simulated ground truth.

import type { EngineRun, Estimate } from './model';

export interface ScoredPerson {
  run: EngineRun;
  /** Ground truth expenditure as logged, one per day, aligned with run.days. */
  truthKcal: readonly number[];
  /** The raw calculator TDEE, never updated. The prior baseline is `run.prior`. */
  formulaKcal: number;
}

export type Level = 'p50' | 'p80' | 'p95';
export const LEVELS: readonly Level[] = ['p50', 'p80', 'p95'];
export const NOMINAL: Readonly<Record<Level, number>> = { p50: 0.5, p80: 0.8, p95: 0.95 };

/** Absolute error (kcal/day) below which a person counts as converged. */
export const CONVERGENCE_TOLERANCE_KCAL = 150;

export interface Baselines {
  engine: number;
  formula: number;
  prior: number;
}

export interface CheckpointMetrics {
  day: number;
  /** Share of people whose truth lies inside the engine's interval. */
  coverage: Record<Level, number>;
  /** The same for the static prior's interval: what the bands would cover with no data. */
  priorCoverage: Record<Level, number>;
  /** `formula` is the raw calculator TDEE; `prior` is the engine's prior mean, never updated. */
  medianAbsErrorKcal: Baselines;
  /** Mean signed error (estimate - truth): systematic bias, if any. */
  meanErrorKcal: Baselines;
  medianPosteriorSdKcal: number;
}

export interface CohortMetrics {
  people: number;
  checkpoints: CheckpointMetrics[];
  /** Per-day curves, index = day. */
  daily: {
    medianAbsErrorKcal: { engine: number[]; formula: number[]; prior: number[] };
    coverage: Record<Level, number[]>;
  };
  /** First day from which the engine's median absolute error stays below the raw formula's; null if never. */
  crossoverDay: number | null;
  convergence: {
    toleranceKcal: number;
    /**
     * Median over people of the first day from which |error| stays within
     * tolerance through the horizon (lower median); null if fewer than half converge.
     */
    medianDay: number | null;
    /** Share of people converged by the horizon. */
    shareConverged: number;
  };
  /** Count of non-finite numbers seen in any posterior. Must be 0. */
  nonFiniteValues: number;
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, x) => sum + x, 0) / values.length;
}

function covers(estimate: Estimate, level: Level, truth: number): boolean {
  const { lower, upper } = estimate.intervals[level];
  return truth >= lower && truth <= upper;
}

function countNonFinite(estimate: Estimate): number {
  const values = [estimate.mean, estimate.sd, ...LEVELS.flatMap((l) => [estimate.intervals[l].lower, estimate.intervals[l].upper])];
  return values.filter((x) => !Number.isFinite(x)).length;
}

function convergenceDay(person: ScoredPerson, horizon: number): number | null {
  let day: number | null = null;
  for (let t = horizon; t >= 0; t -= 1) {
    if (Math.abs(person.run.days[t].expenditure.mean - person.truthKcal[t]) > CONVERGENCE_TOLERANCE_KCAL) break;
    day = t;
  }
  return day;
}

export function scoreCohort(people: readonly ScoredPerson[], checkpoints: readonly number[], horizon: number): CohortMetrics {
  const dayIndices = Array.from({ length: horizon + 1 }, (_, t) => t);
  const engineErrors = dayIndices.map((t) => people.map((p) => p.run.days[t].expenditure.mean - p.truthKcal[t]));
  const formulaErrors = dayIndices.map((t) => people.map((p) => p.formulaKcal - p.truthKcal[t]));
  const priorErrors = dayIndices.map((t) => people.map((p) => p.run.prior.mean - p.truthKcal[t]));
  const coverageAt = (t: number, level: Level) =>
    people.filter((p) => covers(p.run.days[t].expenditure, level, p.truthKcal[t])).length / people.length;
  const priorCoverageAt = (t: number, level: Level) =>
    people.filter((p) => covers(p.run.prior, level, p.truthKcal[t])).length / people.length;

  const engineMae = engineErrors.map((errs) => median(errs.map(Math.abs)));
  const formulaMae = formulaErrors.map((errs) => median(errs.map(Math.abs)));
  const priorMae = priorErrors.map((errs) => median(errs.map(Math.abs)));

  let crossoverDay: number | null = null;
  for (let t = horizon; t >= 0 && engineMae[t] < formulaMae[t]; t -= 1) crossoverDay = t;

  const converged = people.map((p) => convergenceDay(p, horizon));
  const convergedDays = converged.filter((d): d is number => d !== null);
  const sortedAll = converged.map((d) => d ?? Number.POSITIVE_INFINITY).sort((a, b) => a - b);
  const medianAll = sortedAll.length ? sortedAll[(sortedAll.length - 1) >> 1] : Number.POSITIVE_INFINITY;

  return {
    people: people.length,
    checkpoints: checkpoints.map((day) => ({
      day,
      coverage: { p50: coverageAt(day, 'p50'), p80: coverageAt(day, 'p80'), p95: coverageAt(day, 'p95') },
      priorCoverage: { p50: priorCoverageAt(day, 'p50'), p80: priorCoverageAt(day, 'p80'), p95: priorCoverageAt(day, 'p95') },
      medianAbsErrorKcal: { engine: engineMae[day], formula: formulaMae[day], prior: priorMae[day] },
      meanErrorKcal: { engine: mean(engineErrors[day]), formula: mean(formulaErrors[day]), prior: mean(priorErrors[day]) },
      medianPosteriorSdKcal: median(people.map((p) => p.run.days[day].expenditure.sd)),
    })),
    daily: {
      medianAbsErrorKcal: { engine: engineMae, formula: formulaMae, prior: priorMae },
      coverage: {
        p50: dayIndices.map((t) => coverageAt(t, 'p50')),
        p80: dayIndices.map((t) => coverageAt(t, 'p80')),
        p95: dayIndices.map((t) => coverageAt(t, 'p95')),
      },
    },
    crossoverDay,
    convergence: {
      toleranceKcal: CONVERGENCE_TOLERANCE_KCAL,
      medianDay: Number.isFinite(medianAll) ? medianAll : null,
      shareConverged: convergedDays.length / people.length,
    },
    nonFiniteValues: people.reduce((n, p) => n + p.run.days.reduce((m, d) => m + countNonFinite(d.expenditure), 0), 0),
  };
}
