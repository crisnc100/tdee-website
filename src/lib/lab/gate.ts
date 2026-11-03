// The CI gate's coverage checks (src/lib/engine/calibration.test.ts), applied to
// a calibration report so the lab page can say how much room each one has on
// the committed run. The test file stays the authority: gate.test.ts fails if
// these constants drift from it.

import type { CalibrationReport } from '../engine/calibration';
import { LEVELS, NOMINAL, type Level } from '../engine/metrics';
import { checkpoint } from './cohort';

/** Most a band may cover under nominal, as a share. */
export const UNDER_TOLERANCE = 0.06;
/** Most a band may cover over nominal where the over bound applies. */
export const OVER_TOLERANCE = 0.12;
/** How much further from nominal than the prior alone the engine may be. */
export const PRIOR_SLACK = 0.03;
/** Highest mean logging bias whose early bands (days 7 and 14) are gated. */
export const GATED_BIAS_MAX = 0.15;
export const EARLY_GATE_DAYS = [7, 14] as const;

export interface GateCheck {
  /** The rule in plain words, e.g. "the realistic cohort's 50% band at day 56 may sit at most 6 points under nominal". */
  label: string;
  level: Level;
  day: number;
  /** How far the value is inside its bound, as a share; negative means it fails. */
  slack: number;
}

const band = (level: Level) => `${Math.round(NOMINAL[level] * 100)}% band`;

const pts = (share: number) => Math.round(share * 100);

/** `owner` is possessive, e.g. "the realistic cohort's". */
function bandChecks(
  owner: string,
  coverage: Record<Level, number>,
  day: number,
  { over = true }: { over?: boolean } = {},
): GateCheck[] {
  return LEVELS.flatMap((level) => {
    const at = `${owner} ${band(level)} at day ${day} may sit at most`;
    const under: GateCheck = {
      label: `${at} ${pts(UNDER_TOLERANCE)} points under nominal`,
      level,
      day,
      slack: coverage[level] - (NOMINAL[level] - UNDER_TOLERANCE),
    };
    if (!over) return [under];
    return [
      under,
      { label: `${at} ${pts(OVER_TOLERANCE)} points over nominal`, level, day, slack: NOMINAL[level] + OVER_TOLERANCE - coverage[level] },
    ];
  });
}

const pct = (share: number) => `${Math.round(share * 100)}%`;

/** Every coverage check the gate makes, evaluated on `report`. */
export function gateChecks(report: CalibrationReport): GateCheck[] {
  const { realistic, accurateLogger, missingWeeks, maintainer } = report.cohorts;
  const checks: GateCheck[] = [...bandChecks("the realistic cohort's", checkpoint(realistic, 56).coverage, 56)];

  for (const c of realistic.checkpoints) {
    for (const level of LEVELS) {
      const engine = Math.abs(c.coverage[level] - NOMINAL[level]);
      const prior = Math.abs(c.priorCoverage[level] - NOMINAL[level]);
      checks.push({
        label: `the realistic cohort's ${band(level)} at day ${c.day} may sit at most ${pts(PRIOR_SLACK)} points further from nominal than the prior alone`,
        level,
        day: c.day,
        slack: prior + PRIOR_SLACK - engine,
      });
    }
  }

  for (const day of [28, 56]) checks.push(...bandChecks("accurate loggers'", checkpoint(accurateLogger, day).coverage, day));
  checks.push(...bandChecks("the missing-weeks cohort's", checkpoint(missingWeeks, 56).coverage, 56, { over: false }));
  checks.push(...bandChecks("maintainers'", checkpoint(maintainer, 56).coverage, 56, { over: false }));

  const sweep = report.sweep.variants[report.config.priorVariant];
  for (const level of sweep?.levels ?? []) {
    const name = `the ${pct(level.loggingBiasMean)} mean-bias cohort's`;
    if (level.loggingBiasMean <= GATED_BIAS_MAX + 1e-9) {
      for (const day of EARLY_GATE_DAYS) checks.push(...bandChecks(name, checkpoint(level, day).coverage, day, { over: false }));
    }
    checks.push(...bandChecks(name, checkpoint(level, 56).coverage, 56));
  }
  return checks;
}

/** The check with the least room. */
export function tightestCheck(report: CalibrationReport): GateCheck {
  const checks = gateChecks(report);
  return checks.reduce((a, b) => (b.slack < a.slack ? b : a));
}
