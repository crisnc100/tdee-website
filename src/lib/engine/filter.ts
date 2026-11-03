// Kalman filter for expenditure as logged. Linear-Gaussian, three states
// (indices W, E, U in model.ts), one scalar observation per day.
//
// Why a linear Kalman filter: the energy-balance equation is linear in the state
// once the logged intake is treated as a known input, so the exact Bayesian
// update is a Kalman update; there is nothing to gain from a particle filter or
// MCMC for a 3-dimensional Gaussian, and the closed form keeps it deterministic,
// cheap and auditable.
//
// Why three states rather than two: daily scale weight is not trend plus
// independent noise. Water, glycogen and gut contents persist for days, and a
// two-state filter that treats those swings as independent counts every day as
// fresh evidence and becomes overconfident (see README, "Calibration"). The water
// component U is an AR(1) process, which keeps the filter linear.
//
// Transition from the morning of day t to the morning of day t+1, given the
// day's logged intake I:
//   W' = W + (I - E) / rho + w_W        w_W ~ N(0, trendSd^2)
//   E' = E + w_E                        w_E ~ N(0, expenditureDrift^2)
//   U' = phi * U + w_U                  w_U ~ N(0, waterSd^2 * (1 - phi^2))
// Observation on a morning with a weigh-in:
//   z  = W + U + v                      v   ~ N(0, scaleSd^2)
//
// Unlogged intake: the day's intake is modelled as N(recent logged average,
// missingIntakeSd^2), which widens W's process noise by (missingIntakeSd/rho)^2
// and so carries little information about E. Before anything has been logged
// there is no average to anchor on, and the transition drops its dependence on E
// entirely ("unanchored"): such a day says nothing about expenditure.
//
// Outliers: an innovation more than outlierGateSd standard deviations from the
// prediction is not rejected but down-weighted (a Huber-style gate): the
// observation variance is inflated until the innovation sits exactly at the gate.
// A single typo moves the estimate by a bounded amount, while a genuine, lasting
// shift still pulls the state over a few days.

import { allFinite, diag, identity, matVec, propagate, type Mat, type Vec } from './matrix';
import {
  DEFAULT_PARAMS,
  E,
  U,
  W,
  gaussianEstimate,
  type DayLog,
  type DayPosterior,
  type EngineParams,
  type EnginePrior,
  type EngineRun,
  type IntakeStatus,
  type WeighInStatus,
} from './model';

export interface EngineState {
  /** Index of the day whose morning weigh-in comes next. */
  readonly day: number;
  readonly mean: Vec;
  readonly cov: Mat;
  /** Moving average of logged intake, used to impute unlogged days; null until the first log. */
  readonly intakeAverage: number | null;
  readonly loggedIntakeDays: number;
  readonly params: Readonly<EngineParams>;
}

const OBSERVATION: Vec = [1, 0, 1]; // z = W + U

function isPlausible(value: number | null | undefined, [min, max]: readonly [number, number]): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function assertPositiveFinite(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be a positive finite number, got ${value}`);
}

export function createEngine(prior: EnginePrior, params: Readonly<EngineParams> = DEFAULT_PARAMS): EngineState {
  assertPositiveFinite('prior.expenditureKcal', prior.expenditureKcal);
  assertPositiveFinite('prior.expenditureSdKcal', prior.expenditureSdKcal);
  assertPositiveFinite('prior.weightKg', prior.weightKg);
  const mean = [0, 0, 0];
  mean[W] = prior.weightKg;
  mean[E] = prior.expenditureKcal;
  const variances = [0, 0, 0];
  variances[W] = params.initialWeightSdKg ** 2;
  variances[E] = prior.expenditureSdKcal ** 2;
  variances[U] = params.onsetWaterSdKg ** 2;
  return { day: 0, mean, cov: diag(variances), intakeAverage: null, loggedIntakeDays: 0, params };
}

/** Measurement update with one morning weigh-in. Never increases any posterior variance. */
export function observeWeight(
  state: EngineState,
  weightKg: number | null | undefined,
): { state: EngineState; status: WeighInStatus } {
  const { params, mean, cov } = state;
  if (!isPlausible(weightKg, params.plausibleWeightKg)) return { state, status: 'missing' };

  const pHt = matVec(cov, OBSERVATION);
  const predicted = OBSERVATION.reduce((sum, h, i) => sum + h * mean[i], 0);
  const innovation = weightKg - predicted;
  const predictedVariance = OBSERVATION.reduce((sum, h, i) => sum + h * pHt[i], 0);
  let observationVariance = params.scaleSdKg ** 2;
  let innovationVariance = predictedVariance + observationVariance;

  let status: WeighInStatus = 'used';
  const gate = params.outlierGateSd;
  if (innovation * innovation > gate * gate * innovationVariance) {
    // Inflate R so the innovation sits exactly at the gate.
    innovationVariance = (innovation * innovation) / (gate * gate);
    observationVariance = innovationVariance - predictedVariance;
    status = 'downweighted';
  }

  const gain = pHt.map((x) => x / innovationVariance);
  const nextMean = mean.map((x, i) => x + gain[i] * innovation);
  // Joseph form (I - KH) P (I - KH)^T + K R K^T stays symmetric positive semi-definite.
  const iMinusKH = identity(3).map((row, i) => row.map((x, j) => x - gain[i] * OBSERVATION[j]));
  const kRkT = gain.map((ki) => gain.map((kj) => ki * kj * observationVariance));
  const nextCov = propagate(iMinusKH, cov, kRkT);

  if (!allFinite(nextMean) || !allFinite(nextCov)) return { state, status: 'missing' };
  return { state: { ...state, mean: nextMean, cov: nextCov }, status };
}

/** Time update across one day, driven by that day's logged intake. */
export function advanceDay(
  state: EngineState,
  intakeKcal: number | null | undefined,
): { state: EngineState; status: IntakeStatus } {
  const { params } = state;
  const rho = params.kcalPerKg;
  const phi = params.waterPersistence;

  let intakeAverage = state.intakeAverage;
  let loggedIntakeDays = state.loggedIntakeDays;
  let status: IntakeStatus;
  let intakeInput: number;
  let intakeVariance: number;
  let couplesExpenditure = true;

  if (isPlausible(intakeKcal, params.plausibleIntakeKcal)) {
    status = 'logged';
    intakeInput = intakeKcal;
    intakeVariance = 0;
    loggedIntakeDays += 1;
    // Running mean for the first intakeMemoryDays logs, then an exponential moving average.
    const weight = Math.max(1 / loggedIntakeDays, 1 / params.intakeMemoryDays);
    intakeAverage = intakeAverage === null ? intakeKcal : intakeAverage + weight * (intakeKcal - intakeAverage);
  } else if (intakeAverage !== null) {
    status = 'imputed';
    intakeInput = intakeAverage;
    intakeVariance = params.missingIntakeSdKcal ** 2;
  } else {
    status = 'unanchored';
    intakeInput = 0;
    intakeVariance = params.missingIntakeSdKcal ** 2;
    couplesExpenditure = false;
  }

  const transition = identity(3);
  transition[W][E] = couplesExpenditure ? -1 / rho : 0;
  transition[U][U] = phi;

  const noise = [0, 0, 0];
  noise[W] = params.trendSdKg ** 2 + intakeVariance / rho ** 2;
  noise[E] = params.expenditureDriftKcal ** 2;
  noise[U] = params.waterSdKg ** 2 * (1 - phi * phi);

  const nextMean = matVec(transition, state.mean);
  if (couplesExpenditure) nextMean[W] += intakeInput / rho;
  const nextCov = propagate(transition, state.cov, diag(noise));

  const next = allFinite(nextMean) && allFinite(nextCov)
    ? { mean: nextMean, cov: nextCov }
    : { mean: state.mean, cov: state.cov };
  return { state: { ...state, ...next, day: state.day + 1, intakeAverage, loggedIntakeDays }, status };
}

export function expenditureOf(state: EngineState): { mean: number; sd: number } {
  return { mean: state.mean[E], sd: Math.sqrt(state.cov[E][E]) };
}

/** One full day: morning weigh-in, then the day's intake. Returns the posterior after the weigh-in. */
export function step(state: EngineState, log: DayLog): { state: EngineState; posterior: DayPosterior } {
  const observed = observeWeight(state, log.weightKg);
  const { mean, sd } = expenditureOf(observed.state);
  const advanced = advanceDay(observed.state, log.intakeKcal);
  return {
    state: advanced.state,
    posterior: {
      day: state.day,
      expenditure: gaussianEstimate(mean, sd),
      trendWeightKg: { mean: observed.state.mean[W], sd: Math.sqrt(observed.state.cov[W][W]) },
      weighIn: observed.status,
      intake: advanced.status,
    },
  };
}

export function runEngine(prior: EnginePrior, days: readonly DayLog[], params: Readonly<EngineParams> = DEFAULT_PARAMS): EngineRun {
  let state = createEngine(prior, params);
  const posteriors: DayPosterior[] = [];
  for (const log of days) {
    const result = step(state, log);
    posteriors.push(result.posterior);
    state = result.state;
  }
  return { prior: gaussianEstimate(prior.expenditureKcal, prior.expenditureSdKcal), days: posteriors };
}
