import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import committed from '../engine/calibration.json';
import type { CalibrationReport } from '../engine/calibration';
import { EARLY_GATE_DAYS, GATED_BIAS_MAX, OVER_TOLERANCE, PRIOR_SLACK, UNDER_TOLERANCE, gateChecks, tightestCheck } from './gate';
import { readReport } from './report';

const report = readReport(committed);

describe('gate constants', () => {
  // calibration.test.ts is the gate; these are a read-only copy for the page.
  const source = readFileSync(new URL('../engine/calibration.test.ts', import.meta.url), 'utf8');
  const constant = (name: string) => Number(source.match(new RegExp(`const ${name} = ([\\d.]+);`))?.[1]);

  it('match the tolerances in calibration.test.ts', () => {
    expect(constant('UNDER_TOLERANCE')).toBe(UNDER_TOLERANCE);
    expect(constant('OVER_TOLERANCE')).toBe(OVER_TOLERANCE);
    expect(constant('PRIOR_SLACK')).toBe(PRIOR_SLACK);
  });

  it('match the gated bias range and early days in calibration.test.ts', () => {
    expect(Number(source.match(/SWEEP_BIAS_MEANS\.filter\(\(b\) => b <= ([\d.]+)\)/)?.[1])).toBe(GATED_BIAS_MAX);
    expect(source).toContain(`for (const day of [${EARLY_GATE_DAYS.join(', ')}])`);
  });
});

describe('gateChecks on the committed run', () => {
  const checks = gateChecks(report);

  it('makes every coverage check the gate makes', () => {
    // realistic day 56 (6), realistic vs prior (4 days x 3), accurate loggers days 28 and 56 (12),
    // missing weeks and maintainers floors (3 + 3), sweep 0-15% days 7 and 14 floors (24), sweep day 56 (5 x 6).
    expect(checks).toHaveLength(6 + 12 + 12 + 6 + 24 + 30);
  });

  it('passes every one of them, as the README says of the full seed', () => {
    for (const check of checks) expect(check.slack, check.label).toBeGreaterThan(0);
  });

  it('reports the tightest: the realistic 80% band at day 7 against the prior alone', () => {
    const tightest = tightestCheck(report);
    expect(tightest.label).toBe('realistic cohort, 80% band at day 7, against the prior alone');
    const c = report.cohorts.realistic.checkpoints[0];
    expect(tightest.slack).toBeCloseTo(Math.abs(c.priorCoverage.p80 - 0.8) + PRIOR_SLACK - Math.abs(c.coverage.p80 - 0.8), 12);
    expect(Math.min(...checks.map((x) => x.slack))).toBe(tightest.slack);
  });

  it('goes negative when a band breaks its bound', () => {
    const broken = structuredClone(report) as CalibrationReport;
    const day56 = broken.cohorts.realistic.checkpoints.find((c) => c.day === 56);
    if (!day56) throw new Error('fixture');
    day56.coverage.p50 = 0.43;
    const tightest = tightestCheck(broken);
    expect(tightest.label).toBe('realistic cohort, 50% band at day 56, floor');
    expect(tightest.slack).toBeCloseTo(-0.01, 12);
  });
});
