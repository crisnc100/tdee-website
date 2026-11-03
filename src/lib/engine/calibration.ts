// Runs seeded synthetic cohorts through the engine and scores them. Used by
// `npm run calibrate` (full cohort, writes calibration.json) and by the CI gate
// test (smaller cohort). Schema: see CalibrationReport and README.md.

import { runEngine } from './filter';
import { LEVELS, NOMINAL, scoreCohort, type CheckpointMetrics, type CohortMetrics, type ScoredPerson } from './metrics';
import {
  DEFAULT_PARAMS,
  DEFAULT_PRIOR_VARIANT,
  PRIOR_VARIANTS,
  expenditureAsLoggedPrior,
  type EngineParams,
  type LoggingBiasPrior,
  type PriorVariant,
} from './model';
import { deriveSeed } from './prng';
import { simulatePerson, type Scenario, type SimOptions, type SimulatedPerson } from './sim';

export const SCHEMA_VERSION = 2;
export const CHECKPOINT_DAYS = [7, 14, 28, 56] as const;
export const HORIZON_DAYS = 56;
export const SCENARIOS: readonly Scenario[] = ['realistic', 'accurateLogger', 'noLogs', 'missingWeeks', 'maintainer'];
/** Mean logging bias of each sensitivity-sweep cohort. */
export const SWEEP_BIAS_MEANS = [0, 0.05, 0.1, 0.15, 0.2] as const;
const VARIANTS = Object.keys(PRIOR_VARIANTS) as PriorVariant[];
const SWEEP_STREAM_OFFSET = 100;

export interface CalibrationConfig {
  seed: number;
  /** People in the realistic cohort. */
  people: number;
  /** People in each edge cohort. */
  edgePeople: number;
  /** People in each sweep cohort; 0 or omitted skips the sweep. */
  sweepPeople?: number;
  /** Prior variants to sweep; defaults to all of them. */
  sweepVariants?: readonly PriorVariant[];
  params?: Readonly<EngineParams>;
}

export interface SweepLevel {
  loggingBiasMean: number;
  /** Measured mean logging gap as a share of true intake, across the cohort. */
  measuredGapShare: number;
  people: number;
  checkpoints: CheckpointMetrics[];
}

export interface SweepVariant {
  prior: Readonly<LoggingBiasPrior>;
  levels: SweepLevel[];
  /** Largest |coverage - nominal| over every level, checkpoint and interval. */
  worstCoverageDeviation: number;
}

export interface CalibrationReport {
  schemaVersion: number;
  /** The estimated quantity; truth is scored in the same terms. */
  quantity: 'expenditure as logged (kcal/day)';
  config: {
    seed: number;
    people: Record<Scenario, number>;
    sweepPeople: number;
    horizonDays: number;
    checkpointDays: readonly number[];
    priorVariant: PriorVariant;
    prior: Readonly<LoggingBiasPrior>;
    engineParams: Readonly<EngineParams>;
  };
  /** Every cohort runs with config.prior. */
  cohorts: Record<Scenario, CohortMetrics>;
  /** Realistic people at fixed logging-bias levels, under each prior variant. */
  sweep: {
    loggingBiasMeans: readonly number[];
    variants: Partial<Record<PriorVariant, SweepVariant>>;
  };
}

function simulateCohort(stream: number, people: number, scenario: Scenario, options: SimOptions = {}): SimulatedPerson[] {
  return Array.from({ length: people }, (_, i) => simulatePerson(deriveSeed(stream, i), scenario, HORIZON_DAYS, options));
}

function score(people: readonly SimulatedPerson[], prior: Readonly<LoggingBiasPrior>, params: Readonly<EngineParams>): ScoredPerson[] {
  return people.map((person) => {
    const enginePrior = expenditureAsLoggedPrior(person.prior, prior);
    return {
      run: runEngine(enginePrior, person.days, params),
      truthKcal: person.expenditureAsLoggedKcal,
      formulaKcal: person.formulaTdeeKcal,
    };
  });
}

export function runCohort(
  scenario: Scenario,
  seed: number,
  people: number,
  params: Readonly<EngineParams> = DEFAULT_PARAMS,
  prior: Readonly<LoggingBiasPrior> = PRIOR_VARIANTS[DEFAULT_PRIOR_VARIANT],
): CohortMetrics {
  const simulated = simulateCohort(deriveSeed(seed, SCENARIOS.indexOf(scenario)), people, scenario);
  return scoreCohort(score(simulated, prior, params), CHECKPOINT_DAYS, HORIZON_DAYS);
}

function worstDeviation(levels: readonly SweepLevel[]): number {
  return Math.max(...levels.flatMap((l) => l.checkpoints.flatMap((c) => LEVELS.map((lv) => Math.abs(c.coverage[lv] - NOMINAL[lv])))));
}

/** Same simulated people at each bias level for every variant, so variants differ only in the prior. */
export function runSweep(
  seed: number,
  people: number,
  variants: readonly PriorVariant[] = VARIANTS,
  params: Readonly<EngineParams> = DEFAULT_PARAMS,
): Partial<Record<PriorVariant, SweepVariant>> {
  const cohorts = SWEEP_BIAS_MEANS.map((loggingBiasMean, i) => ({
    loggingBiasMean,
    people: simulateCohort(deriveSeed(seed, SWEEP_STREAM_OFFSET + i), people, 'realistic', { loggingBiasMean }),
  }));
  const result: Partial<Record<PriorVariant, SweepVariant>> = {};
  for (const variant of variants) {
    const prior = PRIOR_VARIANTS[variant];
    const levels = cohorts.map(({ loggingBiasMean, people: simulated }) => ({
      loggingBiasMean,
      measuredGapShare: simulated.reduce((sum, p) => sum + p.meanLoggingGapShare, 0) / simulated.length,
      people: simulated.length,
      checkpoints: scoreCohort(score(simulated, prior, params), CHECKPOINT_DAYS, HORIZON_DAYS).checkpoints,
    }));
    result[variant] = { prior, levels, worstCoverageDeviation: worstDeviation(levels) };
  }
  return result;
}

export function runCalibration({
  seed,
  people,
  edgePeople,
  sweepPeople = 0,
  sweepVariants = VARIANTS,
  params = DEFAULT_PARAMS,
}: CalibrationConfig): CalibrationReport {
  const size = (s: Scenario) => (s === 'realistic' ? people : edgePeople);
  const cohorts = Object.fromEntries(SCENARIOS.map((s) => [s, runCohort(s, seed, size(s), params)])) as Record<Scenario, CohortMetrics>;
  return {
    schemaVersion: SCHEMA_VERSION,
    quantity: 'expenditure as logged (kcal/day)',
    config: {
      seed,
      people: Object.fromEntries(SCENARIOS.map((s) => [s, size(s)])) as Record<Scenario, number>,
      sweepPeople,
      horizonDays: HORIZON_DAYS,
      checkpointDays: CHECKPOINT_DAYS,
      priorVariant: DEFAULT_PRIOR_VARIANT,
      prior: PRIOR_VARIANTS[DEFAULT_PRIOR_VARIANT],
      engineParams: params,
    },
    cohorts,
    sweep: {
      loggingBiasMeans: SWEEP_BIAS_MEANS,
      variants: sweepPeople > 0 ? runSweep(seed, sweepPeople, sweepVariants, params) : {},
    },
  };
}

/** Stable JSON: fixed key order from construction, numbers rounded so the file diffs cleanly. */
export function serializeReport(report: CalibrationReport): string {
  const round = (_key: string, value: unknown) =>
    typeof value === 'number' && !Number.isInteger(value) ? Math.round(value * 1e4) / 1e4 : value;
  return `${JSON.stringify(report, round, 2)}\n`;
}
