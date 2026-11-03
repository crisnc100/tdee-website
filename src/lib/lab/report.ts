// Data shaping for the /lab page. Every number the page prints comes from
// calibration.json through these functions; nothing here is fitted or tuned.

import { SCENARIOS, SCHEMA_VERSION, type CalibrationReport } from '../engine/calibration';
import { LEVELS, NOMINAL, type CheckpointMetrics, type CohortMetrics, type Level } from '../engine/metrics';
import type { PriorVariant } from '../engine/model';
import type { Scenario } from '../engine/sim';
import { checkpoint } from './cohort';
import { GATED_BIAS_MAX, OVER_TOLERANCE, UNDER_TOLERANCE } from './gate';

export { checkpoint, engineErrorOn } from './cohort';

/** Days 14-27 of the missingWeeks cohort carry no data (sim.ts; checked in report.test.ts). */
export const MISSING_WEEKS_GAP = { firstDay: 14, lastDay: 27 } as const;

/** Coverage within this many points of nominal is shown as on target. */
export const NEAR_NOMINAL = 0.03;

/**
 * Checks the parts of the report the page reads and returns it typed. A report
 * from another schema version, or one missing a cohort, a checkpoint or a day,
 * throws, so the static build fails rather than rendering a wrong page.
 */
export function readReport(json: unknown): CalibrationReport {
  if (!json || typeof json !== 'object') throw new Error('calibration report: not an object');
  const report = json as CalibrationReport;
  if (report.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`calibration report: schema version ${String(report.schemaVersion)}, the page reads ${SCHEMA_VERSION}`);
  }
  const { config, cohorts, sweep } = report;
  if (!config || !cohorts || !sweep) throw new Error('calibration report: missing config, cohorts or sweep');
  for (const scenario of SCENARIOS) {
    const cohort = cohorts[scenario];
    if (!cohort) throw new Error(`calibration report: no ${scenario} cohort`);
    for (const day of config.checkpointDays) checkpoint(cohort, day);
    const series = [...Object.values(cohort.daily.medianAbsErrorKcal), ...Object.values(cohort.daily.coverage)];
    if (series.some((s) => s.length !== config.horizonDays + 1)) {
      throw new Error(`calibration report: ${scenario} daily series are not ${config.horizonDays + 1} days long`);
    }
  }
  const variant = sweep.variants[config.priorVariant];
  if (!variant) throw new Error(`calibration report: no sweep for the default prior ${config.priorVariant}`);
  for (const level of variant.levels) for (const day of config.checkpointDays) checkpoint(level, day);
  return report;
}

/** "expenditure as logged (kcal/day)" -> name and unit. */
export function parseQuantity(quantity: string): { name: string; unit: string } {
  const match = /^(.*\S)\s*\(([^()]+)\)$/.exec(quantity.trim());
  return match ? { name: match[1], unit: match[2] } : { name: quantity.trim(), unit: '' };
}

/** Largest standard deviation of a coverage share measured on `people` people (at a true share of 50%). */
export function samplingSd(people: number): number {
  return 0.5 / Math.sqrt(people);
}

/**
 * First day from which `a` stays strictly below `b` through the last day; null
 * if it is not below on the last day. The same rule as the report's crossoverDay.
 */
export function firstDayStaysBelow(a: readonly number[], b: readonly number[]): number | null {
  let day: number | null = null;
  for (let t = Math.min(a.length, b.length) - 1; t >= 0 && a[t] < b[t]; t -= 1) day = t;
  return day;
}

export interface Headline {
  quantity: { name: string; unit: string };
  people: number;
  horizonDays: number;
  firstDay: number;
  first: CheckpointMetrics;
  last: CheckpointMetrics;
  /** 1 - engine / formula median error at the horizon. */
  errorCut: number;
  convergence: CohortMetrics['convergence'];
  edgePeople: number;
  sweepPeople: number;
  sweepLevels: number;
  nonFiniteValues: number;
}

/** The realistic cohort's numbers for the page header. */
export function headline(report: CalibrationReport): Headline {
  const { config, cohorts, sweep } = report;
  const realistic = cohorts.realistic;
  const firstDay = config.checkpointDays[0];
  const last = checkpoint(realistic, config.horizonDays);
  const edges = SCENARIOS.filter((s) => s !== 'realistic');
  return {
    quantity: parseQuantity(report.quantity),
    people: config.people.realistic,
    horizonDays: config.horizonDays,
    firstDay,
    first: checkpoint(realistic, firstDay),
    last,
    errorCut: 1 - last.medianAbsErrorKcal.engine / last.medianAbsErrorKcal.formula,
    convergence: realistic.convergence,
    edgePeople: edges.reduce((sum, s) => sum + config.people[s], 0),
    sweepPeople: config.sweepPeople,
    sweepLevels: sweep.loggingBiasMeans.length,
    nonFiniteValues: SCENARIOS.reduce((sum, s) => sum + cohorts[s].nonFiniteValues, 0),
  };
}

export interface AccuracySeries {
  /** Median absolute error by day (index = day), kcal/day. */
  engine: readonly number[];
  formula: readonly number[];
  prior: readonly number[];
  /** First day from which the engine stays below the prior; null if never. */
  belowPriorFrom: number | null;
  /** The report's crossoverDay: first day from which the engine stays below the raw formula. */
  belowFormulaFrom: number | null;
}

export function accuracySeries(cohort: CohortMetrics): AccuracySeries {
  const { engine, formula, prior } = cohort.daily.medianAbsErrorKcal;
  return { engine, formula, prior, belowPriorFrom: firstDayStaysBelow(engine, prior), belowFormulaFrom: cohort.crossoverDay };
}

export interface LevelCell {
  level: Level;
  nominal: number;
  observed: number;
  /** observed - nominal, as a share. */
  deviation: number;
}

export interface CoverageRow {
  day: number;
  cells: LevelCell[];
}

export function levelCells(coverage: Record<Level, number>): LevelCell[] {
  return LEVELS.map((level) => ({ level, nominal: NOMINAL[level], observed: coverage[level], deviation: coverage[level] - NOMINAL[level] }));
}

/** Observed against nominal coverage at each checkpoint. */
export function coverageRows(cohort: CohortMetrics): CoverageRow[] {
  return cohort.checkpoints.map((c) => ({ day: c.day, cells: levelCells(c.coverage) }));
}

export type HeatBin = 'underBeyondGate' | 'under' | 'near' | 'over' | 'overBeyondBound';

/**
 * Shading for a coverage deviation. Under-coverage (bands narrower than they
 * claim) splits at the gate's floor; over-coverage (wider, conservative) at the
 * gate's day-56 ceiling. A value exactly on a bound is inside it, as in the gate.
 */
export function heatBin(deviation: number): HeatBin {
  if (deviation < -UNDER_TOLERANCE) return 'underBeyondGate';
  if (deviation < -NEAR_NOMINAL) return 'under';
  if (deviation <= NEAR_NOMINAL) return 'near';
  if (deviation <= OVER_TOLERANCE) return 'over';
  return 'overBeyondBound';
}

export interface SweepCell {
  day: number;
  observed: number;
  deviation: number;
  bin: HeatBin;
}

export interface SweepRow {
  bias: number;
  measuredGap: number;
  /** Inside the range whose early bands the gate asserts. */
  gatedEarly: boolean;
  levels: { level: Level; nominal: number; cells: SweepCell[] }[];
}

export interface Extreme {
  deviation: number;
  bias: number;
  day: number;
  level: Level;
}

export interface SweepGrid {
  variant: PriorVariant;
  days: number[];
  rows: SweepRow[];
  /** Most negative deviation anywhere in the grid (bands too narrow). */
  worstUnder: Extreme;
  /** Most positive deviation anywhere in the grid (bands too wide). */
  worstOver: Extreme;
  /** Largest |measured mean logging gap - level|, as a share. */
  maxGapMiss: number;
  /** Worst |coverage - nominal| of every swept prior variant, best first. */
  variants: { variant: PriorVariant; worstCoverageDeviation: number }[];
}

/** Coverage of the default prior by logging-bias level and checkpoint day. */
export function sweepGrid(report: CalibrationReport): SweepGrid {
  const variant = report.config.priorVariant;
  const sweep = report.sweep.variants[variant];
  if (!sweep) throw new Error(`calibration report: no sweep for ${variant}`);
  const days = [...report.config.checkpointDays];
  const rows: SweepRow[] = sweep.levels.map((l) => ({
    bias: l.loggingBiasMean,
    measuredGap: l.measuredGapShare,
    gatedEarly: l.loggingBiasMean <= GATED_BIAS_MAX + 1e-9,
    levels: LEVELS.map((level) => ({
      level,
      nominal: NOMINAL[level],
      cells: days.map((day) => {
        const observed = checkpoint(l, day).coverage[level];
        const deviation = observed - NOMINAL[level];
        return { day, observed, deviation, bin: heatBin(deviation) };
      }),
    })),
  }));

  const all: Extreme[] = rows.flatMap((r) =>
    r.levels.flatMap((lv) => lv.cells.map((c) => ({ deviation: c.deviation, bias: r.bias, day: c.day, level: lv.level }))),
  );
  const worstUnder = all.reduce((a, b) => (b.deviation < a.deviation ? b : a));
  const worstOver = all.reduce((a, b) => (b.deviation > a.deviation ? b : a));
  const variants = (Object.keys(report.sweep.variants) as PriorVariant[])
    .map((v) => ({ variant: v, worstCoverageDeviation: report.sweep.variants[v]?.worstCoverageDeviation ?? Infinity }))
    .sort((a, b) => a.worstCoverageDeviation - b.worstCoverageDeviation);

  return {
    variant,
    days,
    rows,
    worstUnder,
    worstOver,
    maxGapMiss: Math.max(...rows.map((r) => Math.abs(r.measuredGap - r.bias))),
    variants,
  };
}

/** One sweep row's coverage at the three levels on `day`. */
export function rowCoverage(row: SweepRow, day: number): Record<Level, number> {
  const out = {} as Record<Level, number>;
  for (const lv of row.levels) {
    const cell = lv.cells.find((c) => c.day === day);
    if (!cell) throw new Error(`calibration report: no sweep cell for day ${day}`);
    out[lv.level] = cell.observed;
  }
  return out;
}

const VARIANT_LABELS: Record<PriorVariant, string> = {
  widen: 'widen only',
  widenAndRecentre: 'widen and recentre',
};

export function variantLabel(variant: PriorVariant): string {
  return VARIANT_LABELS[variant] ?? variant;
}

export const EDGE_SCENARIOS = ['accurateLogger', 'missingWeeks', 'maintainer', 'noLogs'] as const satisfies readonly Scenario[];
export type EdgeScenario = (typeof EDGE_SCENARIOS)[number];

export const EDGE_LABELS: Record<EdgeScenario, string> = {
  accurateLogger: 'accurate loggers',
  missingWeeks: 'missing weeks',
  maintainer: 'maintainers',
  noLogs: 'no logs',
};

export interface EdgeReadout {
  scenario: EdgeScenario;
  people: number;
  first: CheckpointMetrics;
  last: CheckpointMetrics;
  crossoverDay: number | null;
  convergence: CohortMetrics['convergence'];
  /**
   * Largest gap between the engine and the static prior over every checkpoint,
   * in median and mean error, kcal. Zero means the estimate never left the prior.
   */
  maxDistanceFromPrior: number;
}

export function edgeReadout(report: CalibrationReport, scenario: EdgeScenario): EdgeReadout {
  const cohort = report.cohorts[scenario];
  const { checkpointDays, horizonDays } = report.config;
  return {
    scenario,
    people: cohort.people,
    first: checkpoint(cohort, checkpointDays[0]),
    last: checkpoint(cohort, horizonDays),
    crossoverDay: cohort.crossoverDay,
    convergence: cohort.convergence,
    maxDistanceFromPrior: Math.max(
      ...cohort.checkpoints.flatMap((c) => [
        Math.abs(c.medianAbsErrorKcal.engine - c.medianAbsErrorKcal.prior),
        Math.abs(c.meanErrorKcal.engine - c.meanErrorKcal.prior),
      ]),
    ),
  };
}
