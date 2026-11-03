// Runs the adaptive engine over the daily log. The log holds one entry per
// date with gaps; the engine wants consecutive days, so missing dates become
// empty days. Nothing here changes the engine's maths: it only maps dates to
// day indices and reads back what the engine already reports.

import { runEngine } from '../engine/filter';
import {
  expenditureAsLoggedPrior,
  priorFromFormula,
  type DayLog,
  type DayPosterior,
  type EnginePrior,
  type EngineRun,
  type Estimate,
} from '../engine/model';
import { addDays, dayNumber, sortEntries, type LogEntry } from './entries';

/** Used only to seed trend weight when neither the calculator nor the log has one; the first weigh-in replaces it. */
const FALLBACK_WEIGHT_KG = 70;

export interface LogEngineInput {
  /** The calculator's formula TDEE, kcal/day. */
  formulaTdeeKcal: number;
  /** The calculator's weight, kg, if known. */
  weightKg?: number;
}

export interface LogEngineResult {
  /** Date of engine day 0. */
  startDate: string;
  run: EngineRun;
  /** The engine's starting point: the formula, recentred for typical under-logging. */
  prior: Estimate;
  /** The latest posterior: after the weigh-in on the last logged date. */
  current: DayPosterior;
  /** Days covered, first entry to last inclusive: "day N". */
  dayCount: number;
  /** Dates whose weigh-in the engine down-weighted as an outlier. */
  outlierDates: ReadonlySet<string>;
  weighIns: number;
  intakeDays: number;
  /**
   * False until the log can say anything about expenditure: that takes a
   * weigh-in, then a day with calories logged (or imputed from earlier logs),
   * then a later weigh-in. Until then the estimate is the prior.
   */
  learning: boolean;
}

/** Consecutive engine days from the first logged date to the last. */
export function toEngineDays(entries: readonly LogEntry[]): { startDate: string; days: DayLog[] } | null {
  if (entries.length === 0) return null;
  const sorted = sortEntries(entries);
  const startDate = sorted[0].date;
  const start = dayNumber(startDate);
  const days: DayLog[] = Array.from({ length: dayNumber(sorted[sorted.length - 1].date) - start + 1 }, () => ({}));
  for (const entry of sorted) {
    days[dayNumber(entry.date) - start] = { weightKg: entry.weightKg, intakeKcal: entry.intakeKcal };
  }
  return { startDate, days };
}

export function logEnginePrior(entries: readonly LogEntry[], input: LogEngineInput): EnginePrior {
  const firstWeight = sortEntries(entries).find((e) => e.weightKg !== undefined)?.weightKg;
  const weightKg = input.weightKg && input.weightKg > 0 ? input.weightKg : (firstWeight ?? FALLBACK_WEIGHT_KG);
  return expenditureAsLoggedPrior(priorFromFormula(input.formulaTdeeKcal, weightKg));
}

export function runLogEngine(entries: readonly LogEntry[], input: LogEngineInput): LogEngineResult | null {
  const mapped = toEngineDays(entries);
  if (!mapped || !(input.formulaTdeeKcal > 0)) return null;
  const run = runEngine(logEnginePrior(entries, input), mapped.days);

  const outlierDates = new Set<string>();
  let weighIns = 0;
  let intakeDays = 0;
  let learning = false;
  let fedSinceWeighIn = false; // a day with intake coupled to expenditure, after some weigh-in
  for (const posterior of run.days) {
    const weighed = posterior.weighIn !== 'missing';
    if (weighed) {
      weighIns += 1;
      if (fedSinceWeighIn) learning = true;
    }
    if (posterior.weighIn === 'downweighted') outlierDates.add(addDays(mapped.startDate, posterior.day));
    if (posterior.intake === 'logged') intakeDays += 1;
    if (weighIns > 0 && posterior.intake !== 'unanchored') fedSinceWeighIn = true;
  }
  return {
    startDate: mapped.startDate,
    run,
    prior: run.prior,
    current: run.days[run.days.length - 1],
    dayCount: run.days.length,
    outlierDates,
    weighIns,
    intakeDays,
    learning,
  };
}
