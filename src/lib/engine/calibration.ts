// Runs seeded synthetic cohorts through the engine and scores them. Used by
// `npm run calibrate` (full cohort, writes calibration.json) and by the CI gate
// test (smaller cohort). Schema: see CalibrationReport and README.md.

import { runEngine } from './filter';
import { scoreCohort, type CohortMetrics } from './metrics';
import { DEFAULT_PARAMS, PRIOR_RELATIVE_SD, type EngineParams } from './model';
import { deriveSeed } from './prng';
import { simulatePerson, type Scenario } from './sim';

export const SCHEMA_VERSION = 1;
export const CHECKPOINT_DAYS = [7, 14, 28, 56] as const;
export const HORIZON_DAYS = 56;
export const SCENARIOS: readonly Scenario[] = ['realistic', 'accurateLogger', 'noLogs', 'missingWeeks', 'maintainer'];

export interface CalibrationConfig {
  seed: number;
  /** People in the realistic cohort. */
  people: number;
  /** People in each edge cohort. */
  edgePeople: number;
  params?: Readonly<EngineParams>;
}

export interface CalibrationReport {
  schemaVersion: number;
  /** The estimated quantity; truth is scored in the same terms. */
  quantity: 'expenditure as logged (kcal/day)';
  config: {
    seed: number;
    people: Record<Scenario, number>;
    horizonDays: number;
    checkpointDays: readonly number[];
    priorRelativeSd: number;
    engineParams: Readonly<EngineParams>;
  };
  cohorts: Record<Scenario, CohortMetrics>;
}

export function runCohort(scenario: Scenario, seed: number, people: number, params: Readonly<EngineParams>): CohortMetrics {
  const stream = deriveSeed(seed, SCENARIOS.indexOf(scenario));
  const scored = Array.from({ length: people }, (_, i) => {
    const person = simulatePerson(deriveSeed(stream, i), scenario, HORIZON_DAYS);
    return {
      run: runEngine(person.prior, person.days, params),
      truthKcal: person.expenditureAsLoggedKcal,
      formulaKcal: person.formulaTdeeKcal,
    };
  });
  return scoreCohort(scored, CHECKPOINT_DAYS, HORIZON_DAYS);
}

export function runCalibration({ seed, people, edgePeople, params = DEFAULT_PARAMS }: CalibrationConfig): CalibrationReport {
  const size = (s: Scenario) => (s === 'realistic' ? people : edgePeople);
  const cohorts = Object.fromEntries(SCENARIOS.map((s) => [s, runCohort(s, seed, size(s), params)])) as Record<Scenario, CohortMetrics>;
  return {
    schemaVersion: SCHEMA_VERSION,
    quantity: 'expenditure as logged (kcal/day)',
    config: {
      seed,
      people: Object.fromEntries(SCENARIOS.map((s) => [s, size(s)])) as Record<Scenario, number>,
      horizonDays: HORIZON_DAYS,
      checkpointDays: CHECKPOINT_DAYS,
      priorRelativeSd: PRIOR_RELATIVE_SD,
      engineParams: params,
    },
    cohorts,
  };
}

/** Stable JSON: fixed key order from construction, numbers rounded so the file diffs cleanly. */
export function serializeReport(report: CalibrationReport): string {
  const round = (_key: string, value: unknown) =>
    typeof value === 'number' && !Number.isInteger(value) ? Math.round(value * 1e4) / 1e4 : value;
  return `${JSON.stringify(report, round, 2)}\n`;
}
