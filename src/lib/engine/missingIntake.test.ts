// Pins the direction of the missing-intake bias that README.md and the /lab
// page describe. A controlled, noiseless person: true expenditure is constant,
// weight follows the true energy balance exactly, and one day a week is a big
// overeating day. Unlogged days are imputed from the logged average, so leaving
// the high days out hides their calories: weight runs above what the log
// explains and the engine reads expenditure LOW.

import { describe, expect, it } from 'vitest';
import { runEngine } from './filter';
import { DEFAULT_PARAMS, priorFromFormula, type DayLog } from './model';

const TRUE_EXPENDITURE = 2400;
const LOW = 2200;
const HIGH = 3600; // one day a week; the weekly mean intake equals TRUE_EXPENDITURE
const DAYS = 84;
const START_KG = 85;

const intake = Array.from({ length: DAYS }, (_, d) => (d % 7 === 5 ? HIGH : LOW));
const weights: number[] = [];
for (let d = 0, w = START_KG; d < DAYS; d += 1) {
  weights.push(w);
  w += (intake[d] - TRUE_EXPENDITURE) / DEFAULT_PARAMS.kcalPerKg;
}
// Centred on the truth, so any bias comes from the logs, not the prior.
const prior = priorFromFormula(TRUE_EXPENDITURE, START_KG);

function finalEstimate(skip: (day: number) => boolean): number {
  const days: DayLog[] = weights.map((weightKg, d) => ({ weightKg, intakeKcal: skip(d) ? undefined : intake[d] }));
  const run = runEngine(prior, days);
  return run.days[run.days.length - 1].expenditure.mean;
}

describe('missing intake on selected days', () => {
  const complete = finalEstimate(() => false);
  // The high days' surplus over the logged average, spread over every day.
  const hiddenPerDay = (HIGH - LOW) / 7;

  it('recovers the true expenditure from complete logs', () => {
    expect(complete).toBeCloseTo(TRUE_EXPENDITURE, 0); // 2400.0
  });

  it('reads low when the overeating days go unlogged, by most of the hidden calories', () => {
    const skippedHigh = finalEstimate((d) => intake[d] === HIGH); // 2213.6
    expect(skippedHigh).toBeLessThan(complete);
    expect(complete - skippedHigh).toBeGreaterThan(hiddenPerDay * 0.75); // 186 of 200 kcal/day
    expect(complete - skippedHigh).toBeLessThan(hiddenPerDay * 1.25);
  });

  it('reads high in the mirror case, when a low day goes unlogged', () => {
    expect(finalEstimate((d) => d % 7 === 1)).toBeGreaterThan(complete); // 2430.4
  });
});
