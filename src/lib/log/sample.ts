// "Load sample weeks": eight weeks of a synthetic person from the engine's own
// simulator, for a one-click demo. Deterministic: the same inputs and day give
// the same sample. It lives in memory only and never touches the saved log.

import { calculateTDEE } from '../calculator';
import { simulatePerson } from '../engine/sim';
import type { UserData } from '../../types/calculator';
import { addDays, checkEntry, type LogEntry } from './entries';

/**
 * Picked from the first 400 seeds because it reads well for very different
 * users: steady loss, a few missed days, three scale spikes for the outlier
 * flag, and under-logging of about 9% so "as logged" visibly differs from the
 * formula. Checked against four profiles (both sexes, both unit systems).
 */
export const SAMPLE_SEED = 23;
export const SAMPLE_DAYS = 56;

export interface SampleLog {
  entries: LogEntry[];
  /** The simulator's true expenditure as logged, by date. Only a sample can show this. */
  truth: { date: string; kcal: number }[];
  /** The person simulated: the user's own inputs when matched, otherwise the simulator's. */
  userData: UserData;
  /** True when the sample uses the user's own calculator inputs. */
  matched: boolean;
  /** How much less this person logs than they eat, on average, kcal/day. */
  meanLoggingGapKcal: number;
}

export interface SampleRequest {
  /** The calculator's inputs, if any. */
  userData: UserData | null;
  /** The formula TDEE on screen. The sample is matched only if userData reproduces it. */
  formulaTdeeKcal: number;
  /** Last day of the sample, ISO; the sample ends today. */
  today: string;
}

function reproduces(userData: UserData | null, formulaTdeeKcal: number): userData is UserData {
  if (!userData || !(userData.weight > 0) || !(userData.height > 0) || !(userData.age > 0)) return false;
  return calculateTDEE(userData).tdee === formulaTdeeKcal;
}

export function buildSample({ userData, formulaTdeeKcal, today }: SampleRequest): SampleLog {
  const matched = reproduces(userData, formulaTdeeKcal);
  const person = simulatePerson(
    SAMPLE_SEED,
    'realistic',
    SAMPLE_DAYS - 1,
    matched ? { userData: userData as UserData } : {},
  );
  const dateOf = (day: number) => addDays(today, day - (SAMPLE_DAYS - 1));

  const entries: LogEntry[] = [];
  person.days.forEach((day, i) => {
    // The log refuses what the engine would ignore, so a value outside the
    // plausible range (the simulator's rare reading in pounds) is dropped.
    const date = dateOf(i);
    const weight = day.weightKg != null && checkEntry({ date, weightKg: day.weightKg }).ok ? day.weightKg : undefined;
    const intake = day.intakeKcal != null && checkEntry({ date, intakeKcal: day.intakeKcal }).ok ? day.intakeKcal : undefined;
    if (weight === undefined && intake === undefined) return;
    entries.push({ date, ...(weight !== undefined ? { weightKg: weight } : {}), ...(intake !== undefined ? { intakeKcal: intake } : {}) });
  });

  return {
    entries,
    truth: person.expenditureAsLoggedKcal.map((kcal, i) => ({ date: dateOf(i), kcal })),
    userData: person.userData,
    matched,
    meanLoggingGapKcal: person.meanLoggingGapKcal,
  };
}
