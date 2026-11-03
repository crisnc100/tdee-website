import { describe, expect, it } from 'vitest';
import committed from '../engine/calibration.json';
import { SCENARIOS, type CalibrationReport } from '../engine/calibration';
import { LEVELS, NOMINAL } from '../engine/metrics';
import { deriveSeed } from '../engine/prng';
import { simulatePerson } from '../engine/sim';
import {
  EDGE_SCENARIOS,
  MISSING_WEEKS_GAP,
  accuracySeries,
  coverageRows,
  edgeReadout,
  firstDayStaysBelow,
  headline,
  heatBin,
  parseQuantity,
  readReport,
  samplingSd,
  sweepGrid,
  variantLabel,
} from './report';

const report = readReport(committed);
const copy = (): CalibrationReport => structuredClone(report);

describe('readReport', () => {
  it('accepts the committed calibration.json unchanged', () => {
    expect(report).toBe(committed);
  });

  it('rejects another schema version', () => {
    expect(() => readReport({ ...copy(), schemaVersion: 1 })).toThrow(/schema version 1/);
  });

  it('rejects a missing cohort, checkpoint, day or default sweep', () => {
    const noCohort = copy() as unknown as { cohorts: Record<string, unknown> };
    delete noCohort.cohorts.maintainer;
    expect(() => readReport(noCohort)).toThrow(/no maintainer cohort/);

    const noCheckpoint = copy();
    noCheckpoint.cohorts.realistic.checkpoints.pop();
    expect(() => readReport(noCheckpoint)).toThrow(/no checkpoint for day 56/);

    const shortSeries = copy();
    shortSeries.cohorts.noLogs.daily.coverage.p80.pop();
    expect(() => readReport(shortSeries)).toThrow(/noLogs daily series/);

    const noSweep = copy();
    delete noSweep.sweep.variants[noSweep.config.priorVariant];
    expect(() => readReport(noSweep)).toThrow(/no sweep/);
  });

  it('rejects something that is not a report', () => {
    expect(() => readReport(null)).toThrow();
    expect(() => readReport('calibration')).toThrow();
  });
});

describe('small helpers', () => {
  it('splits the quantity into a name and a unit', () => {
    expect(parseQuantity(report.quantity)).toEqual({ name: 'expenditure as logged', unit: 'kcal/day' });
    expect(parseQuantity('bare quantity')).toEqual({ name: 'bare quantity', unit: '' });
  });

  it('gives the largest SD of a coverage share for a cohort size', () => {
    expect(samplingSd(2000)).toBeCloseTo(0.01118, 5);
    expect(samplingSd(5000)).toBeCloseTo(0.00707, 5);
  });

  it('names both prior variants', () => {
    expect(variantLabel('widen')).toBe('widen only');
    expect(variantLabel('widenAndRecentre')).toBe('widen and recentre');
  });
});

describe('firstDayStaysBelow', () => {
  it('finds the first day from which a stays below b through the end', () => {
    expect(firstDayStaysBelow([5, 3, 4, 3, 2], [4, 4, 4, 4, 4])).toBe(3);
    expect(firstDayStaysBelow([1, 1, 1], [2, 2, 2])).toBe(0);
  });

  it('is null when a is not below b on the last day; equal is not below', () => {
    expect(firstDayStaysBelow([1, 1, 5], [2, 2, 2])).toBeNull();
    expect(firstDayStaysBelow([1, 2], [2, 2])).toBeNull();
    expect(firstDayStaysBelow([], [])).toBeNull();
  });

  it('agrees with the report crossoverDay for every cohort (engine against the raw formula)', () => {
    for (const scenario of SCENARIOS) {
      const { engine, formula } = report.cohorts[scenario].daily.medianAbsErrorKcal;
      expect(firstDayStaysBelow(engine, formula), scenario).toBe(report.cohorts[scenario].crossoverDay);
    }
  });
});

describe('headline', () => {
  const h = headline(report);

  it('reads the realistic cohort at the first checkpoint and the horizon', () => {
    expect(h.people).toBe(report.config.people.realistic);
    expect(h.horizonDays).toBe(report.config.horizonDays);
    expect(h.first.day).toBe(report.config.checkpointDays[0]);
    expect(h.last.day).toBe(report.config.horizonDays);
    expect(h.last).toBe(report.cohorts.realistic.checkpoints.at(-1));
    expect(h.convergence).toBe(report.cohorts.realistic.convergence);
  });

  it('derives the error cut against the raw formula, and cohort totals', () => {
    const { engine, formula } = h.last.medianAbsErrorKcal;
    expect(h.errorCut).toBeCloseTo(1 - engine / formula, 12);
    expect(h.edgePeople).toBe(SCENARIOS.filter((s) => s !== 'realistic').reduce((n, s) => n + report.config.people[s], 0));
    expect(h.sweepLevels).toBe(report.sweep.loggingBiasMeans.length);
    expect(h.nonFiniteValues).toBe(0);
  });
});

describe('accuracySeries', () => {
  const series = accuracySeries(report.cohorts.realistic);

  it('passes the daily curves through, one value per day', () => {
    for (const curve of [series.engine, series.formula, series.prior]) expect(curve).toHaveLength(report.config.horizonDays + 1);
    expect(series.belowFormulaFrom).toBe(report.cohorts.realistic.crossoverDay);
  });

  it('finds the day the engine pulls below its prior for good', () => {
    const day = series.belowPriorFrom;
    expect(day).not.toBeNull();
    if (day === null) return;
    for (let t = day; t < series.engine.length; t += 1) expect(series.engine[t]).toBeLessThan(series.prior[t]);
    if (day > 0) expect(series.engine[day - 1]).toBeGreaterThanOrEqual(series.prior[day - 1]);
  });
});

describe('coverageRows', () => {
  it('gives observed, nominal and deviation at every checkpoint and level', () => {
    const rows = coverageRows(report.cohorts.realistic);
    expect(rows.map((r) => r.day)).toEqual([...report.config.checkpointDays]);
    for (const [i, row] of rows.entries()) {
      const source = report.cohorts.realistic.checkpoints[i].coverage;
      expect(row.cells.map((c) => c.level)).toEqual([...LEVELS]);
      for (const cell of row.cells) {
        expect(cell.observed).toBe(source[cell.level]);
        expect(cell.nominal).toBe(NOMINAL[cell.level]);
        expect(cell.deviation).toBeCloseTo(source[cell.level] - NOMINAL[cell.level], 12);
      }
    }
  });
});

describe('heatBin', () => {
  it('splits under-coverage at the gate floor and over-coverage at the gate ceiling, bounds inclusive', () => {
    expect(heatBin(-0.0601)).toBe('underBeyondGate');
    expect(heatBin(-0.06)).toBe('under');
    expect(heatBin(-0.031)).toBe('under');
    expect(heatBin(-0.03)).toBe('near');
    expect(heatBin(0)).toBe('near');
    expect(heatBin(0.03)).toBe('near');
    expect(heatBin(0.031)).toBe('over');
    expect(heatBin(0.12)).toBe('over');
    expect(heatBin(0.1201)).toBe('overBeyondBound');
  });
});

describe('sweepGrid', () => {
  const grid = sweepGrid(report);
  const variant = report.sweep.variants[report.config.priorVariant];
  if (!variant) throw new Error('no default sweep');

  it('has one row per bias level, three levels each, one cell per checkpoint', () => {
    expect(grid.variant).toBe(report.config.priorVariant);
    expect(grid.rows.map((r) => r.bias)).toEqual([...report.sweep.loggingBiasMeans]);
    for (const [i, row] of grid.rows.entries()) {
      expect(row.measuredGap).toBe(variant.levels[i].measuredGapShare);
      expect(row.levels.map((l) => l.level)).toEqual([...LEVELS]);
      for (const lv of row.levels) {
        expect(lv.cells.map((c) => c.day)).toEqual([...report.config.checkpointDays]);
        for (const cell of lv.cells) {
          const source = variant.levels[i].checkpoints.find((c) => c.day === cell.day);
          expect(cell.observed).toBe(source?.coverage[lv.level]);
          expect(cell.bin).toBe(heatBin(cell.observed - NOMINAL[lv.level]));
        }
      }
    }
  });

  it('marks 0-15% as the gated range and 20% as outside it', () => {
    expect(grid.rows.filter((r) => r.gatedEarly).map((r) => r.bias)).toEqual([0, 0.05, 0.1, 0.15]);
    expect(grid.rows.filter((r) => !r.gatedEarly).map((r) => r.bias)).toEqual([0.2]);
  });

  it('finds the extremes over every cell', () => {
    const all = grid.rows.flatMap((r) => r.levels.flatMap((l) => l.cells.map((c) => c.deviation)));
    expect(grid.worstUnder.deviation).toBe(Math.min(...all));
    expect(grid.worstOver.deviation).toBe(Math.max(...all));
    // The default prior's worst case is its largest over-coverage (README: 17.5 points).
    expect(grid.worstOver.deviation).toBeCloseTo(variant.worstCoverageDeviation, 12);
  });

  it('finds an under-coverage planted anywhere in the grid', () => {
    const planted = copy();
    const level = planted.sweep.variants[planted.config.priorVariant]?.levels[2];
    const c = level?.checkpoints.find((x) => x.day === 28);
    if (!c) throw new Error('fixture');
    c.coverage.p80 = 0.61;
    const found = sweepGrid(planted).worstUnder;
    expect(found).toEqual({ deviation: expect.closeTo(-0.19, 12), bias: 0.1, day: 28, level: 'p80' });
  });

  it('measures how far each cohort’s logging gap sits from its level, and ranks the prior variants', () => {
    expect(grid.maxGapMiss).toBeCloseTo(
      Math.max(...variant.levels.map((l) => Math.abs(l.measuredGapShare - l.loggingBiasMean))),
      12,
    );
    expect(grid.maxGapMiss).toBeLessThan(0.005); // README: within 0.5 points
    expect(grid.variants.map((v) => v.variant).sort()).toEqual(Object.keys(report.sweep.variants).sort());
    expect(grid.variants[0].variant).toBe(report.config.priorVariant);
    expect(grid.variants[0].worstCoverageDeviation).toBeLessThan(grid.variants[1].worstCoverageDeviation);
  });
});

describe('edgeReadout', () => {
  it('reads each edge cohort at the first checkpoint and the horizon', () => {
    for (const scenario of EDGE_SCENARIOS) {
      const r = edgeReadout(report, scenario);
      const cohort = report.cohorts[scenario];
      expect(r.people).toBe(report.config.people[scenario]);
      expect(r.first).toBe(cohort.checkpoints[0]);
      expect(r.last).toBe(cohort.checkpoints.at(-1));
      expect(r.crossoverDay).toBe(cohort.crossoverDay);
    }
  });

  it('shows the no-logs estimate never leaves the prior, and the others do', () => {
    expect(edgeReadout(report, 'noLogs').maxDistanceFromPrior).toBeLessThan(1e-6);
    for (const scenario of ['accurateLogger', 'missingWeeks', 'maintainer'] as const) {
      expect(edgeReadout(report, scenario).maxDistanceFromPrior, scenario).toBeGreaterThan(10);
    }
  });
});

describe('MISSING_WEEKS_GAP', () => {
  // The gap is hard-coded in sim.ts, not in calibration.json; this keeps the page's copy of it honest.
  const people = Array.from({ length: 40 }, (_, i) => simulatePerson(deriveSeed(99, i), 'missingWeeks', 56));

  it('is a stretch with no weigh-ins and no calories for every missingWeeks person', () => {
    for (const person of people) {
      for (let day = MISSING_WEEKS_GAP.firstDay; day <= MISSING_WEEKS_GAP.lastDay; day += 1) {
        expect(person.days[day].weightKg, `day ${day}`).toBeUndefined();
        expect(person.days[day].intakeKcal, `day ${day}`).toBeUndefined();
      }
    }
  });

  it('starts and ends where the simulator does: the days either side are logged by someone', () => {
    for (const day of [MISSING_WEEKS_GAP.firstDay - 1, MISSING_WEEKS_GAP.lastDay + 1]) {
      expect(people.some((p) => p.days[day].weightKg !== undefined), `day ${day}`).toBe(true);
    }
  });
});
