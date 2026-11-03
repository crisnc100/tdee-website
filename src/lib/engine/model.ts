// Model definition for the adaptive TDEE engine: the estimated quantity, the
// state-space parameters, the input/output types and the formula prior.
// See README.md in this folder for the full derivation.
//
// The estimated quantity is EXPENDITURE AS LOGGED: the daily expenditure E that
// makes the user's logged intake agree with their observed weight trend,
//   trend weight change per day = (logged intake - E) / KCAL_PER_KG.
// With only a scale and a food log, a constant under-reporting bias b and a true
// expenditure offset enter that equation only as their sum, so they cannot be
// told apart. The engine therefore never estimates b; it estimates
// E = true expenditure - mean (true intake - logged intake), which is exactly the
// number a user should plan their logged intake against.
//
// State vector, indexed by the constants below:
//   W  trend (tissue) weight, kg
//   E  expenditure as logged, kcal/day
//   U  water component of scale weight, kg (mean-reverting, see filter.ts)

import { calculateTDEE } from '../calculator';
import type { UserData } from '../../types/calculator';

/** State indices. */
export const W = 0;
export const E = 1;
export const U = 2;

/**
 * Energy content of one kilogram of body-weight change, in kcal.
 * The classic 3500 kcal/lb rule (Wishnofsky, 1958) is 7716 kcal/kg; 7700 is the
 * usual rounding. Real tissue varies (roughly 6500-9000 kcal/kg depending on the
 * fat/lean mix), which the simulator deliberately models and this engine does not.
 */
export const KCAL_PER_KG = 7700;

/**
 * Relative SD of the formula's own error as a prediction of TRUE TDEE.
 * Basis: Frankenfield, Roth-Yousey & Compher (2005, J Am Diet Assoc 105:775-789)
 * found Mifflin-St Jeor predicts resting metabolic rate within +/-10% of measured
 * values in about 82% of non-obese and 70% of obese adults, i.e. an SD of about
 * 8-9% for RMR alone. Activity multipliers add further error, so 10% of TDEE is
 * a conservative round figure. The calculator's error-margin slider is a display
 * preference and is intentionally not used here.
 */
export const PRIOR_RELATIVE_SD = 0.1;

/**
 * How the engine's prior on expenditure AS LOGGED is built from the formula.
 * The formula predicts true TDEE; E is true TDEE minus the user's mean logging
 * gap, which the formula knows nothing about. So E's prior is
 *   mean = formula * (1 - loggingBiasMean)
 *   sd   = formula * sqrt(formulaRelativeSd^2 + loggingBiasSd^2)
 * treating the two errors as independent.
 */
export interface LoggingBiasPrior {
  formulaRelativeSd: number;
  /** Assumed mean share of true intake that goes unlogged. */
  loggingBiasMean: number;
  /** Between-person SD of that share. */
  loggingBiasSd: number;
}

/**
 * Between-person SD of logging bias: 10 percentage points. This is a judgment,
 * not a published figure. Subar et al. (2003, below) report group means only in
 * their abstract; the spread between people is not quantified there.
 */
export const LOGGING_BIAS_SD = 0.1;

/**
 * Mean logging bias for the recentred variant: 10%.
 * Source: Subar AF, Kipnis V, Troiano RP, et al. Using intake biomarkers to
 * evaluate the extent of dietary misreporting in a large sample of adults: the
 * OPEN study. Am J Epidemiol 2003;158(1):1-13. doi:10.1093/aje/kwg092.
 * In 484 adults aged 40-69, energy intake on 24-hour recalls was under-reported
 * against doubly-labelled-water total energy expenditure by 12-14% in men and
 * 16-20% in women on average (31-36% and 34-38% on food-frequency questionnaires).
 * The paper does not give 10%: it is a discount below its lowest figure, on our
 * assumption (not the paper's) that daily app logging is better than recall.
 * Centring at 12% was tried and fails the early-coverage gate for honest
 * loggers (see README).
 */
export const LOGGING_BIAS_MEAN = 0.1;

export const PRIOR_VARIANTS = Object.freeze({
  /** (a) Keep the centre at the formula TDEE; widen for unknown logging bias. */
  widen: Object.freeze({ formulaRelativeSd: PRIOR_RELATIVE_SD, loggingBiasMean: 0, loggingBiasSd: LOGGING_BIAS_SD }),
  /** (b) Widen, and recentre by the cited mean under-reporting. */
  widenAndRecentre: Object.freeze({ formulaRelativeSd: PRIOR_RELATIVE_SD, loggingBiasMean: LOGGING_BIAS_MEAN, loggingBiasSd: LOGGING_BIAS_SD }),
}) satisfies Record<string, Readonly<LoggingBiasPrior>>;

export type PriorVariant = keyof typeof PRIOR_VARIANTS;

/** Chosen by the calibration sweep across logging-bias levels; see README. */
export const DEFAULT_PRIOR_VARIANT: PriorVariant = 'widenAndRecentre';

/**
 * One day of user data. Days are consecutive; a gap is a day with fields omitted.
 * Convention: `weightKg` is the morning weigh-in (before that day's food), and
 * `intakeKcal` is everything logged during that day. Pass undefined/null for a
 * day that was not logged; implausible or non-finite values are treated the same.
 */
export interface DayLog {
  weightKg?: number | null;
  intakeKcal?: number | null;
}

/**
 * Prior for a new user: mean and SD of the starting expenditure (see
 * `expenditureAsLoggedPrior` for how it is built from the formula). `weightKg`
 * seeds the trend weight loosely; the first weigh-in replaces it.
 */
export interface EnginePrior {
  expenditureKcal: number;
  expenditureSdKcal: number;
  weightKg: number;
}

/** Tunable constants of the state-space model. All SDs are per day unless noted. */
export interface EngineParams {
  /** Energy density of weight change (kcal/kg). */
  kcalPerKg: number;
  /** Process SD of trend weight: tissue change not explained by logged energy balance. */
  trendSdKg: number;
  /** Random-walk SD of expenditure, letting the estimate follow adaptation over time. */
  expenditureDriftKcal: number;
  /** Day-to-day persistence (AR(1) coefficient) of the water component. */
  waterPersistence: number;
  /** Stationary SD of the water component (glycogen, sodium, gut contents). */
  waterSdKg: number;
  /** Independent scale noise per weigh-in. */
  scaleSdKg: number;
  /** SD of a day's true intake when it was not logged (imputed from recent logs). */
  missingIntakeSdKcal: number;
  /** Window of the moving average used to impute unlogged days. */
  intakeMemoryDays: number;
  /** Innovations beyond this many SDs are down-weighted (Huber gate). */
  outlierGateSd: number;
  /** SD of the trend-weight prior before the first weigh-in. */
  initialWeightSdKg: number;
  /** Inputs outside these ranges are treated as missing. */
  plausibleWeightKg: readonly [number, number];
  plausibleIntakeKcal: readonly [number, number];
}

export const DEFAULT_PARAMS: Readonly<EngineParams> = Object.freeze({
  kcalPerKg: KCAL_PER_KG,
  trendSdKg: 0.02,
  expenditureDriftKcal: 12,
  waterPersistence: 0.75,
  waterSdKg: 0.45,
  scaleSdKg: 0.35,
  missingIntakeSdKcal: 800,
  intakeMemoryDays: 14,
  outlierGateSd: 3,
  initialWeightSdKg: 10,
  plausibleWeightKg: [25, 350] as const,
  plausibleIntakeKcal: [0, 12000] as const,
});

export interface Interval {
  lower: number;
  upper: number;
}

/** A Gaussian estimate with central credible intervals. */
export interface Estimate {
  mean: number;
  sd: number;
  intervals: { p50: Interval; p80: Interval; p95: Interval };
}

export type WeighInStatus = 'used' | 'downweighted' | 'missing';
/**
 * `logged`: the logged intake drove the weight prediction.
 * `imputed`: not logged; a recent average with a wide SD was used instead.
 * `unanchored`: not logged and nothing logged yet; the day carries no information about expenditure.
 */
export type IntakeStatus = 'logged' | 'imputed' | 'unanchored';

export interface DayPosterior {
  day: number;
  /** Posterior of expenditure as logged, after this day's weigh-in. */
  expenditure: Estimate;
  /** Posterior of trend (tissue) weight, after this day's weigh-in. */
  trendWeightKg: { mean: number; sd: number };
  weighIn: WeighInStatus;
  intake: IntakeStatus;
}

export interface EngineRun {
  /** The formula prior, unchanged by data. */
  prior: Estimate;
  /** One posterior per input day, in order. */
  days: DayPosterior[];
}

const Z = { p50: 0.6744897501960817, p80: 1.2815515655446004, p95: 1.959963984540054 } as const;

export function gaussianEstimate(mean: number, sd: number): Estimate {
  const interval = (z: number): Interval => ({ lower: mean - z * sd, upper: mean + z * sd });
  return { mean, sd, intervals: { p50: interval(Z.p50), p80: interval(Z.p80), p95: interval(Z.p95) } };
}

/** The formula's prior on true TDEE (kcal/day, 10% SD) and a starting weight (kg). */
export function priorFromFormula(formulaTdeeKcal: number, weightKg: number): EnginePrior {
  return {
    expenditureKcal: formulaTdeeKcal,
    expenditureSdKcal: PRIOR_RELATIVE_SD * formulaTdeeKcal,
    weightKg,
  };
}

const KG_PER_LB = 1 / 2.20462; // same factor as calculator.ts

/**
 * The formula's prior on TRUE TDEE from the calculator's own inputs. The engine
 * estimates expenditure as logged, so pass this through `expenditureAsLoggedPrior`
 * (or use `enginePriorFromUserData`) before running the engine.
 */
export function priorFromUserData(userData: UserData): EnginePrior {
  const weightKg = userData.units === 'imperial' ? userData.weight * KG_PER_LB : userData.weight;
  return priorFromFormula(calculateTDEE(userData).tdee, weightKg);
}

/** Converts a formula prior on true TDEE into the engine's prior on expenditure as logged. */
export function expenditureAsLoggedPrior(
  formulaPrior: EnginePrior,
  spec: Readonly<LoggingBiasPrior> = PRIOR_VARIANTS[DEFAULT_PRIOR_VARIANT],
): EnginePrior {
  const formula = formulaPrior.expenditureKcal;
  return {
    expenditureKcal: formula * (1 - spec.loggingBiasMean),
    expenditureSdKcal: formula * Math.hypot(spec.formulaRelativeSd, spec.loggingBiasSd),
    weightKg: formulaPrior.weightKg,
  };
}

/** The prior the engine should run with for a calculator user. */
export function enginePriorFromUserData(userData: UserData): EnginePrior {
  return expenditureAsLoggedPrior(priorFromUserData(userData));
}
