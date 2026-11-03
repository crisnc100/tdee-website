import type { CheckpointMetrics, CohortMetrics } from '../engine/metrics';

/** The checkpoint for `day`; throws if the report has none, so a schema gap fails the build. */
export function checkpoint(source: { checkpoints: readonly CheckpointMetrics[] }, day: number): CheckpointMetrics {
  const found = source.checkpoints.find((c) => c.day === day);
  if (!found) throw new Error(`calibration report: no checkpoint for day ${day}`);
  return found;
}

/** The engine's median absolute error on `day`, from the daily curve. */
export function engineErrorOn(cohort: CohortMetrics, day: number): number {
  const value = cohort.daily.medianAbsErrorKcal.engine[day];
  if (value === undefined) throw new Error(`calibration report: no daily error for day ${day}`);
  return value;
}
