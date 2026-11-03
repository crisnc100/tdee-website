// Synthetic cohort generator. It is deliberately richer than the filter's model,
// so the calibration results measure the engine under misspecification rather
// than on data drawn from its own assumptions. What the simulator adds that the
// filter does not model:
//   - true expenditure that is off the formula by a person-specific factor
//   - expenditure that falls with lost weight and with adaptive thermogenesis
//   - tissue energy density that differs from KCAL_PER_KG per person
//   - a glycogen/water shift over the first days of a deficit (or surplus)
//   - water swings with person-specific persistence, plus a post-weekend bump
//   - a person-level logging bias and extra under-logging at weekends
//   - day-to-day noise in intake and expenditure
//   - missing weigh-ins, missing intake days, whole missing weeks
//   - scale outliers, including the occasional reading in pounds
// All parameter ranges are plausible assumptions chosen to stress the engine,
// not measurements; see README.md.

import { calculateTDEE } from '../calculator';
import type { Exercise, UserData } from '../../types/calculator';
import { priorFromUserData, type DayLog, type EnginePrior } from './model';
import { createRng, type Rng } from './prng';

export type Scenario =
  /** The main cohort: varied people and goals, every misspecification switched on. */
  | 'realistic'
  /** Weigh-ins only; intake is never logged. Expenditure is not identifiable. */
  | 'noLogs'
  /** As realistic, with days 14-27 entirely missing. */
  | 'missingWeeks'
  /** Eats at true expenditure, so tissue weight is flat; still under-logs. */
  | 'maintainer'
  /**
   * Diagnostic: as realistic, but logs exactly what they eat. Separates the
   * filter's own calibration from the formula prior's blindness to under-logging.
   */
  | 'accurateLogger';

export interface SimulatedPerson {
  userData: UserData;
  prior: EnginePrior;
  formulaTdeeKcal: number;
  /** What the engine sees, one entry per day (day 0 to horizon inclusive). */
  days: DayLog[];
  /** Ground truth for scoring: expenditure as logged on each day (see simulatePerson). */
  expenditureAsLoggedKcal: number[];
  /** Mean of (true intake - what the person would log) over all days, kcal/day. */
  meanLoggingGapKcal: number;
}

const KG_PER_LB = 1 / 2.20462;
const CM_PER_INCH = 2.54;

function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

function randomExercises(rng: Rng): Exercise[] {
  const count = rng.weighted([[0, 3], [1, 4], [2, 2]] as const);
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    type: rng.weighted([['weight_lifting', 3], ['cardio', 3], ['hiit', 1], ['yoga', 1], ['sports', 1]] as const),
    intensity: rng.weighted([['light', 1], ['moderate', 2], ['vigorous', 1]] as const),
    minutes: 5 * Math.round(rng.uniform(20, 90) / 5),
    frequency: Math.round(rng.uniform(1, 5)),
  }));
}

/** A plausible calculator user, in either unit system and either calculator mode. */
export function randomUserData(rng: Rng): UserData {
  const gender = rng.bernoulli(0.5) ? 'male' : 'female';
  const age = Math.round(rng.uniform(18, 70));
  const heightCm = clamp(gender === 'male' ? rng.normal(176, 7) : rng.normal(163, 6.5), 145, 205);
  const bmi = clamp(Math.exp(rng.normal(Math.log(26), 0.15)), 18, 45);
  const weightKg = bmi * (heightCm / 100) ** 2;
  const advanced = rng.bernoulli(0.3);
  const imperial = rng.bernoulli(0.4);
  const totalInches = heightCm / CM_PER_INCH;

  const base: UserData = {
    age,
    gender,
    units: imperial ? 'imperial' : 'metric',
    weight: imperial ? weightKg / KG_PER_LB : weightKg,
    height: imperial ? totalInches : heightCm,
    ...(imperial ? { heightFeet: Math.floor(totalInches / 12), heightInches: totalInches % 12 } : {}),
    jobActivity: rng.weighted([['desk', 5], ['standing', 2], ['walking', 1.5], ['physical', 1], ['heavy_physical', 0.5]] as const),
    steps: 500 * Math.round(rng.uniform(2000, 14000) / 500),
    calculatorMode: advanced ? 'advanced' : 'simple',
  };
  if (!advanced) {
    return {
      ...base,
      simpleExerciseLevel: rng.weighted([
        ['none', 2], ['very_light', 2], ['light', 2], ['moderate', 2], ['active', 1], ['very_active', 0.5],
      ] as const),
    };
  }
  // Deurenberg (1991) body-fat estimate from BMI, plus measurement scatter.
  const bodyFat = clamp(1.2 * bmi + 0.23 * age - 10.8 * (gender === 'male' ? 1 : 0) - 5.4 + rng.normal(0, 3), 6, 50);
  return { ...base, ...(rng.bernoulli(0.7) ? { bodyFat } : {}), exercises: randomExercises(rng) };
}

/**
 * Simulates one person for days 0..horizonDays.
 *
 * Ground truth. Let I_t be true intake, L_t what the person would log on day t
 * (whether or not they log it), and X_t their smooth true expenditure (without
 * the day's random activity noise). The person's mean logging gap is
 *   gap = mean_t (I_t - L_t)
 * over every simulated day, and the truth the engine is scored against is
 *   expenditure as logged_t = X_t - gap.
 * Then logged intake minus expenditure as logged equals true intake minus true
 * expenditure on average, which is exactly what the engine's model claims.
 */
export function simulatePerson(seed: number, scenario: Scenario, horizonDays: number): SimulatedPerson {
  const rng = createRng(seed);
  const userData = randomUserData(rng);
  const prior = priorFromUserData(userData);
  const formula = calculateTDEE(userData).tdee;

  // Physiology, fixed per person.
  const metabolicFactor = Math.exp(rng.normal(0, 0.08)); // true vs formula expenditure
  const baseExpenditure = formula * metabolicFactor;
  const kcalPerKg = clamp(rng.normal(7700, 500), 6500, 9000);
  const kcalPerKgLost = rng.uniform(15, 30); // expenditure falls as weight falls
  const adaptationShare = rng.uniform(0, 0.15); // adaptive thermogenesis, share of deficit
  const adaptationDays = 14;
  const waterPersistence = rng.uniform(0.5, 0.9);
  const waterSd = rng.uniform(0.25, 0.7);
  const weekendWaterKg = rng.uniform(0, 0.4);
  const scaleSd = rng.uniform(0.1, 0.3);
  const glycogenKgPer500 = rng.uniform(0.3, 1.2);
  const glycogenDays = rng.uniform(1.5, 4);

  // Behaviour, fixed per person.
  const accurate = scenario === 'accurateLogger';
  const loggingBias = accurate ? 0 : clamp(rng.normal(0.04, 0.05), -0.05, 0.3); // share of intake never logged
  const weekendUnderLog = accurate ? 0 : rng.uniform(0, 0.25); // extra share missed on Saturday/Sunday
  const weekendEatMore = 1.1;
  const intakeNoise = 0.12;
  const goal = scenario === 'maintainer' ? 'maintain' : rng.weighted([['lose', 55], ['maintain', 25], ['gain', 20]] as const);
  const goalDelta = goal === 'lose' ? -rng.uniform(300, 750) : goal === 'gain' ? rng.uniform(200, 450) : 0;
  const loggedTarget = formula + goalDelta; // they eat to the calculator's number, as logged
  const startDayOfWeek = Math.floor(rng.uniform(0, 7)); // 0 = Monday
  const missWeighIn = rng.uniform(0, 0.4);
  const missIntake = scenario === 'noLogs' ? 1 : rng.uniform(0, 0.25);
  const outlierRate = rng.uniform(0, 0.03);
  const vacationStart = rng.bernoulli(0.15) ? Math.floor(rng.uniform(10, 45)) : -1;

  const plannedTrueIntake = loggedTarget / (1 - loggingBias);
  const initialDeficit = scenario === 'maintainer' ? 0 : baseExpenditure - plannedTrueIntake;
  const glycogenTarget = -glycogenKgPer500 * clamp(initialDeficit / 500, -1, 2);

  const startTissue = prior.weightKg + rng.normal(0, 1.5); // self-reported weight is approximate
  let tissue = startTissue;
  let adaptation = 0;
  let glycogen = 0;
  let water = rng.normal(0, waterSd);

  const days: DayLog[] = [];
  const smoothExpenditure: number[] = [];
  let gapSum = 0;

  for (let day = 0; day <= horizonDays; day += 1) {
    const dayOfWeek = (day + startDayOfWeek) % 7;
    const weekend = dayOfWeek >= 5;
    const expenditure = baseExpenditure + kcalPerKgLost * (tissue - startTissue) - adaptation;
    smoothExpenditure.push(expenditure);

    const meanIntake = scenario === 'maintainer' ? expenditure : plannedTrueIntake * (weekend ? weekendEatMore : 1);
    const trueIntake = Math.max(0, meanIntake * (1 + rng.normal(0, intakeNoise)));
    const wouldLog = trueIntake * (1 - loggingBias) * (weekend ? 1 - weekendUnderLog : 1);
    gapSum += trueIntake - wouldLog;

    let scale = tissue + glycogen + water + (dayOfWeek === 0 ? weekendWaterKg : 0) + rng.normal(0, scaleSd);
    if (rng.bernoulli(outlierRate)) scale += (rng.bernoulli(0.5) ? 1 : -1) * rng.uniform(2, 10);
    if (rng.bernoulli(0.002)) scale /= KG_PER_LB; // entered in pounds

    const gap = (day >= vacationStart && day < vacationStart + 7) || (scenario === 'missingWeeks' && day >= 14 && day < 28);
    days.push({
      weightKg: gap || rng.bernoulli(missWeighIn) ? undefined : Math.round(scale * 10) / 10,
      intakeKcal: gap || rng.bernoulli(missIntake) ? undefined : Math.round(wouldLog),
    });

    const trueExpenditure = expenditure + rng.normal(0, 120); // daily activity noise
    tissue += (trueIntake - trueExpenditure) / kcalPerKg;
    adaptation += (adaptationShare * (expenditure - trueIntake) - adaptation) / adaptationDays;
    glycogen += (glycogenTarget - glycogen) / glycogenDays;
    water = waterPersistence * water + rng.normal(0, waterSd * Math.sqrt(1 - waterPersistence ** 2));
  }

  const meanLoggingGapKcal = gapSum / (horizonDays + 1);
  return {
    userData,
    prior,
    formulaTdeeKcal: formula,
    days,
    expenditureAsLoggedKcal: smoothExpenditure.map((x) => x - meanLoggingGapKcal),
    meanLoggingGapKcal,
  };
}
