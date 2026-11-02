// vitest runs through `npx vitest` and is not in devDependencies yet, so tsc
// cannot resolve it. Drop these two comment lines once vitest is installed.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { describe, expect, it } from 'vitest';
import { calculateComparison, calculateMacros, calculateTDEE } from './calculator';
import type { Exercise, MacroSplit, TDEEResult, UserData } from '../types/calculator';

// Baseline: 30-year-old man, 80 kg, 180 cm, desk job, 0 steps, no exercise.
// Mifflin-St Jeor: 10*80 + 6.25*180 - 5*30 + 5 = 1780. TDEE = 1780 + 50 (desk) = 1830.
function user(overrides: Partial<UserData> = {}): UserData {
  return {
    age: 30,
    gender: 'male',
    units: 'metric',
    weight: 80,
    height: 180,
    jobActivity: 'desk',
    steps: 0,
    calculatorMode: 'simple',
    simpleExerciseLevel: 'none',
    exercises: [],
    ...overrides,
  };
}

let nextId = 0;
function exercise(
  type: Exercise['type'],
  intensity: Exercise['intensity'],
  minutes: number,
  frequency: number,
): Exercise {
  nextId += 1;
  return { id: String(nextId), type, intensity, minutes, frequency };
}

function componentSum(result: TDEEResult): number {
  const c = result.components;
  return c.bmr + c.muscleFactor + c.jobActivity + c.neat + c.exercise + c.muscleRecovery;
}

function allNumbers(result: TDEEResult): number[] {
  return [
    result.bmr,
    result.tdee,
    result.errorMargin.lower,
    result.errorMargin.upper,
    ...Object.values(result.components),
    ...Object.values(result.recommendation),
  ];
}

function expectSane(result: TDEEResult) {
  for (const n of allNumbers(result)) {
    expect(Number.isFinite(n)).toBe(true);
    expect(Number.isInteger(n)).toBe(true);
    expect(n).toBeGreaterThanOrEqual(0);
  }
  expect(result.errorMargin.lower).toBeLessThanOrEqual(result.tdee);
  expect(result.errorMargin.upper).toBeGreaterThanOrEqual(result.tdee);
}

describe('calculateTDEE: Mifflin-St Jeor BMR', () => {
  it('male, metric', () => {
    const r = calculateTDEE(user());
    expect(r.bmr).toBe(1780);
    expect(r.components.bmr).toBe(1780);
    expect(r.tdee).toBe(1830);
  });

  it('female, metric', () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 1345.25
    const r = calculateTDEE(user({ gender: 'female', weight: 60, height: 165, age: 25 }));
    expect(r.bmr).toBe(1345);
    expect(r.tdee).toBe(1395); // 1395.25
  });

  it('male, imperial (lb and total inches)', () => {
    // 180 lb = 81.6467 kg, 70 in = 177.8 cm -> 1732.72
    const r = calculateTDEE(user({ units: 'imperial', weight: 180, height: 70, age: 40 }));
    expect(r.bmr).toBe(1733);
    expect(r.tdee).toBe(1783);
  });

  it('female, imperial', () => {
    // 140 lb = 63.503 kg, 64 in = 162.56 cm, age 35 -> 1315.03
    const r = calculateTDEE(
      user({ gender: 'female', units: 'imperial', weight: 140, height: 64, age: 35 }),
    );
    expect(r.bmr).toBe(1315);
    expect(r.tdee).toBe(1365);
  });

  it('subtracts 5 kcal per year of age', () => {
    const a = calculateTDEE(user({ age: 30 }));
    const b = calculateTDEE(user({ age: 31 }));
    expect(a.bmr - b.bmr).toBe(5);
  });

  it('male and female constants differ by 166 kcal (+5 vs -161)', () => {
    const male = calculateTDEE(user());
    const female = calculateTDEE(user({ gender: 'female' }));
    expect(male.bmr - female.bmr).toBe(166);
  });
});

describe('calculateTDEE: unit conversions', () => {
  it('converts lb -> kg with 2.20462 and in -> cm with 2.54', () => {
    // 80 kg = 176.3696 lb; 177.8 cm = 70 in. Both give 1766.25.
    const metric = calculateTDEE(user({ weight: 80, height: 177.8 }));
    const imperial = calculateTDEE(user({ units: 'imperial', weight: 176.3696, height: 70 }));
    expect(metric.bmr).toBe(1766);
    expect(imperial.bmr).toBe(metric.bmr);
    expect(imperial.tdee).toBe(metric.tdee);
  });

  it('5 ft 10 in arrives as 70 total inches and is treated as 177.8 cm', () => {
    const feetInches = calculateTDEE(
      user({ units: 'imperial', weight: 176.3696, height: 5 * 12 + 10, heightFeet: 5, heightInches: 10 }),
    );
    expect(feetInches.bmr).toBe(1766);
  });

  it('uses kilograms for NEAT when input is imperial', () => {
    const metric = calculateTDEE(user({ steps: 10000 }));
    const imperial = calculateTDEE(
      user({ units: 'imperial', weight: 176.3696, height: 180 / 2.54, steps: 10000 }),
    );
    expect(metric.components.neat).toBe(480);
    expect(imperial.components.neat).toBe(480);
  });
});

describe('calculateTDEE: Katch-McArdle BMR (advanced mode + body fat)', () => {
  it('male, 80 kg at 20% body fat: 370 + 21.6 * 64 = 1752.4', () => {
    const r = calculateTDEE(user({ calculatorMode: 'advanced', bodyFat: 20 }));
    expect(r.bmr).toBe(1752);
    expect(r.components.bmr).toBe(1752);
  });

  it('female, 60 kg at 30% body fat: 370 + 21.6 * 42 = 1277.2', () => {
    const r = calculateTDEE(
      user({ gender: 'female', weight: 60, height: 165, calculatorMode: 'advanced', bodyFat: 30 }),
    );
    expect(r.bmr).toBe(1277);
  });

  it('ignores age and sex (lean mass only)', () => {
    const base = { calculatorMode: 'advanced' as const, bodyFat: 25 };
    const a = calculateTDEE(user({ ...base }));
    const b = calculateTDEE(user({ ...base, gender: 'female', age: 60 }));
    expect(a.bmr).toBe(1666); // 370 + 21.6 * 60
    expect(b.bmr).toBe(1666);
  });

  it('converts imperial weight before computing lean mass', () => {
    // 200 lb = 90.718 kg, 75% lean = 68.039 kg -> 1839.64
    const r = calculateTDEE(
      user({ units: 'imperial', weight: 200, height: 70, calculatorMode: 'advanced', bodyFat: 25 }),
    );
    expect(r.bmr).toBe(1840);
  });

  it('falls back to Mifflin-St Jeor without body fat', () => {
    expect(calculateTDEE(user({ calculatorMode: 'advanced' })).bmr).toBe(1780);
    expect(calculateTDEE(user({ calculatorMode: 'advanced', bodyFat: 0 })).bmr).toBe(1780);
  });

  it('simple mode keeps Mifflin-St Jeor even when body fat is entered', () => {
    expect(calculateTDEE(user({ bodyFat: 25 })).bmr).toBe(1780);
  });
});

describe('calculateTDEE: muscle factor', () => {
  it('applies x1.05 to BMR for a lean, heavy-enough man (bf < 15, weight >= bracket)', () => {
    // 180 cm bracket = 73 kg. 1780 * 1.05 = 1869.
    const r = calculateTDEE(user({ bodyFat: 12 }));
    expect(r.bmr).toBe(1869);
    expect(r.components.muscleFactor).toBe(89);
    expect(r.tdee).toBe(1919);
  });

  it('reports the raw formula BMR in components so the muscle bonus is not counted twice', () => {
    const r = calculateTDEE(user({ bodyFat: 12 }));
    expect(r.components.bmr).toBe(1780);
    expect(r.components.bmr + r.components.muscleFactor).toBe(r.bmr);
  });

  it('does not apply at the body-fat threshold (male 15%, female 22%)', () => {
    expect(calculateTDEE(user({ bodyFat: 15 })).bmr).toBe(1780);
    const female = { gender: 'female' as const, weight: 60, height: 165, age: 25 };
    expect(calculateTDEE(user({ ...female, bodyFat: 22 })).bmr).toBe(1345);
    expect(calculateTDEE(user({ ...female, bodyFat: 21.9 })).bmr).toBe(1413); // 1345.25 * 1.05
  });

  it('does not apply below the height bracket weight', () => {
    // 180 cm bracket is 73 kg; 72 kg at 10% is not flagged. 720 + 1125 - 150 + 5 = 1700.
    expect(calculateTDEE(user({ weight: 72, bodyFat: 10 })).bmr).toBe(1700);
  });

  it('uses the nearest height bracket', () => {
    // 172 cm -> 170 cm bracket (67 kg)
    expect(calculateTDEE(user({ height: 172, weight: 67, bodyFat: 10 })).bmr).toBe(1680);
    expect(calculateTDEE(user({ height: 172, weight: 66.9, bodyFat: 10 })).bmr).toBe(1599);
  });

  it('converts imperial input before checking the bracket', () => {
    // 71 in = 180.34 cm -> 73 kg bracket. 165 lb = 74.8 kg (yes), 160 lb = 72.6 kg (no).
    const yes = calculateTDEE(user({ units: 'imperial', height: 71, weight: 165, bodyFat: 12 }));
    const no = calculateTDEE(user({ units: 'imperial', height: 71, weight: 160, bodyFat: 12 }));
    expect(yes.components.muscleFactor).toBeGreaterThan(0);
    expect(no.components.muscleFactor).toBe(0);
  });

  it('requires a body-fat value', () => {
    expect(calculateTDEE(user()).components.muscleFactor).toBe(0);
  });
});

describe('calculateTDEE: job activity adder', () => {
  const cases: Array<[UserData['jobActivity'], number]> = [
    ['desk', 50],
    ['standing', 100],
    ['walking', 200],
    ['physical', 300],
    ['heavy_physical', 400],
  ];
  for (const [job, kcal] of cases) {
    it(`${job} adds ${kcal} kcal`, () => {
      const r = calculateTDEE(user({ jobActivity: job }));
      expect(r.components.jobActivity).toBe(kcal);
      expect(r.tdee).toBe(1780 + kcal);
    });
  }
});

describe('calculateTDEE: NEAT from steps', () => {
  it('is 0.06 * steps * kg / 100', () => {
    const r = calculateTDEE(user({ steps: 10000 }));
    expect(r.components.neat).toBe(480);
    expect(r.tdee).toBe(1780 + 50 + 480);
  });

  it('scales with body weight', () => {
    expect(calculateTDEE(user({ steps: 5000, weight: 60 })).components.neat).toBe(180);
  });
});

describe('calculateTDEE: exercise (simple mode levels)', () => {
  const cases: Array<[NonNullable<UserData['simpleExerciseLevel']>, number]> = [
    ['none', 0],
    ['very_light', 75],
    ['light', 150],
    ['moderate', 250],
    ['active', 325],
    ['very_active', 450],
  ];
  for (const [level, kcal] of cases) {
    it(`${level} adds ${kcal} kcal/day`, () => {
      const r = calculateTDEE(user({ simpleExerciseLevel: level }));
      expect(r.components.exercise).toBe(kcal);
      expect(r.tdee).toBe(1830 + kcal);
    });
  }

  it('treats a missing level as none', () => {
    expect(calculateTDEE(user({ simpleExerciseLevel: undefined })).components.exercise).toBe(0);
  });
});

describe('calculateTDEE: exercise (advanced mode)', () => {
  // 60 min x 7 days / 7 = 60 min/day, so kcal/day = rate * 60.
  const rates: Array<[Exercise['type'], Exercise['intensity'], number]> = [
    ['weight_lifting', 'light', 3.5],
    ['weight_lifting', 'moderate', 5.5],
    ['weight_lifting', 'vigorous', 4.5],
    ['cardio', 'light', 6],
    ['cardio', 'moderate', 9],
    ['cardio', 'vigorous', 12.5],
    ['hiit', 'light', 7],
    ['hiit', 'moderate', 10],
    ['hiit', 'vigorous', 13.5],
    ['yoga', 'light', 2.5],
    ['yoga', 'moderate', 4],
    ['yoga', 'vigorous', 5],
    ['sports', 'light', 6],
    ['sports', 'moderate', 9],
    ['sports', 'vigorous', 11],
  ];
  for (const [type, intensity, rate] of rates) {
    it(`${type}/${intensity} burns ${rate} kcal/min`, () => {
      const r = calculateTDEE(
        user({ calculatorMode: 'advanced', exercises: [exercise(type, intensity, 60, 7)] }),
      );
      expect(r.components.exercise).toBe(rate * 60);
      expect(r.tdee).toBe(1830 + rate * 60);
    });
  }

  it('sums several exercises and averages them over 7 days', () => {
    // cardio moderate 9 * 45 * 4 / 7 = 231.43; lifting light 3.5 * 60 * 3 / 7 = 90
    const r = calculateTDEE(
      user({
        calculatorMode: 'advanced',
        exercises: [exercise('cardio', 'moderate', 45, 4), exercise('weight_lifting', 'light', 60, 3)],
      }),
    );
    expect(r.components.exercise).toBe(321);
    expect(r.tdee).toBe(2151); // 1830 + 321.43
  });

  it('adds nothing when advanced mode has no exercises and no legacy data', () => {
    const r = calculateTDEE(user({ calculatorMode: 'advanced', exercises: [] }));
    expect(r.components.exercise).toBe(0);
    expect(r.tdee).toBe(1830);
  });

  it('still reads legacy single-exercise fields when present', () => {
    // cardio vigorous 12.5 * 30 * 4 / 7 = 214.29
    const r = calculateTDEE(
      user({
        calculatorMode: 'advanced',
        exercises: [],
        exerciseType: 'cardio',
        exerciseIntensity: 'vigorous',
        exerciseMinutes: 30,
        trainingFrequency: 4,
      }),
    );
    expect(r.components.exercise).toBe(214);
  });

  it('fills missing legacy fields with the legacy defaults (60 min, 3x, moderate)', () => {
    // yoga moderate 4 * 60 * 3 / 7 = 102.86
    const r = calculateTDEE(user({ calculatorMode: 'advanced', exerciseType: 'yoga' }));
    expect(r.components.exercise).toBe(103);
  });
});

describe('calculateTDEE: muscle recovery boost', () => {
  const muscular = { bodyFat: 12, calculatorMode: 'advanced' as const };

  it('adds 60 kcal for a muscular person training 5+ hours a week', () => {
    const r = calculateTDEE(user({ ...muscular, exercises: [exercise('weight_lifting', 'moderate', 60, 5)] }));
    expect(r.components.muscleRecovery).toBe(60);
  });

  it('adds nothing below 5 hours a week', () => {
    const r = calculateTDEE(user({ ...muscular, exercises: [exercise('weight_lifting', 'moderate', 49, 6)] }));
    expect(r.components.muscleRecovery).toBe(0);
  });

  it('adds nothing for a non-muscular person', () => {
    const r = calculateTDEE(
      user({ calculatorMode: 'advanced', exercises: [exercise('weight_lifting', 'moderate', 120, 5)] }),
    );
    expect(r.components.muscleRecovery).toBe(0);
  });

  it('counts legacy minutes x frequency', () => {
    const r = calculateTDEE(user({ ...muscular, exerciseMinutes: 60, trainingFrequency: 5 }));
    expect(r.components.muscleRecovery).toBe(60);
  });

  it('ignores advanced-mode exercises left over while simple mode is selected', () => {
    const r = calculateTDEE(
      user({
        bodyFat: 12,
        calculatorMode: 'simple',
        simpleExerciseLevel: 'none',
        exercises: [exercise('weight_lifting', 'moderate', 60, 6)],
      }),
    );
    expect(r.components.exercise).toBe(0);
    expect(r.components.muscleRecovery).toBe(0);
  });
});

describe('calculateTDEE: error margin', () => {
  it('defaults to +/-7%', () => {
    const r = calculateTDEE(user());
    expect(r.errorMargin).toEqual({ lower: 1702, upper: 1958 });
  });

  it('uses the preference percentage', () => {
    expect(calculateTDEE(user({ errorMarginPreference: 12 })).errorMargin).toEqual({ lower: 1610, upper: 2050 });
    expect(calculateTDEE(user({ errorMarginPreference: 3 })).errorMargin).toEqual({ lower: 1775, upper: 1885 });
  });

  it('falls back to 7% for unusable preferences', () => {
    for (const bad of [0, NaN, -5, 100, 150, Infinity]) {
      expect(calculateTDEE(user({ errorMarginPreference: bad })).errorMargin).toEqual({ lower: 1702, upper: 1958 });
    }
  });
});

describe('calculateTDEE: goal adjustments', () => {
  it('applies fixed deficits and surpluses around maintenance', () => {
    // 1780 + 400 + 480 + 450 = 3110
    const r = calculateTDEE(
      user({ jobActivity: 'heavy_physical', steps: 10000, simpleExerciseLevel: 'very_active' }),
    );
    expect(r.tdee).toBe(3110);
    expect(r.recommendation).toEqual({
      maintain: 3110,
      mildWeightLoss: 2860,
      weightLoss: 2610,
      extremeWeightLoss: 2360,
      mildWeightGain: 3360,
      weightGain: 3610,
    });
  });

  it('never recommends less than 1200 kcal for a woman', () => {
    // 1345.25 + 50 + 180 = 1575.25
    const r = calculateTDEE(user({ gender: 'female', weight: 60, height: 165, age: 25, steps: 5000 }));
    expect(r.tdee).toBe(1575);
    expect(r.recommendation.mildWeightLoss).toBe(1325);
    expect(r.recommendation.weightLoss).toBe(1200);
    expect(r.recommendation.extremeWeightLoss).toBe(1200);
    expect(r.recommendation.weightGain).toBe(2075);
  });

  it('never recommends less than 1500 kcal for a man', () => {
    // 700 + 1075 - 250 + 5 = 1530, + 50 + 84 = 1664
    const r = calculateTDEE(user({ weight: 70, height: 172, age: 50, steps: 2000 }));
    expect(r.tdee).toBe(1664);
    expect(r.recommendation.mildWeightLoss).toBe(1500);
    expect(r.recommendation.weightLoss).toBe(1500);
    expect(r.recommendation.extremeWeightLoss).toBe(1500);
  });

  it('never recommends more than maintenance for a loss goal when TDEE is under the floor', () => {
    // 500 + 968.75 - 300 - 161 + 50 + 90 = 1147.75
    const r = calculateTDEE(user({ gender: 'female', weight: 50, height: 155, age: 60, steps: 3000 }));
    expect(r.tdee).toBe(1148);
    expect(r.recommendation.mildWeightLoss).toBe(1148);
    expect(r.recommendation.weightLoss).toBe(1148);
    expect(r.recommendation.extremeWeightLoss).toBe(1148);
    expect(r.recommendation.mildWeightGain).toBe(1398);
    expect(r.recommendation.weightGain).toBe(1648);
  });

  it('orders the targets from most to least aggressive', () => {
    for (const weight of [40, 60, 80, 120]) {
      for (const gender of ['male', 'female'] as const) {
        const rec = calculateTDEE(user({ weight, gender, steps: 4000 })).recommendation;
        expect(rec.extremeWeightLoss).toBeLessThanOrEqual(rec.weightLoss);
        expect(rec.weightLoss).toBeLessThanOrEqual(rec.mildWeightLoss);
        expect(rec.mildWeightLoss).toBeLessThanOrEqual(rec.maintain);
        expect(rec.maintain).toBeLessThan(rec.mildWeightGain);
        expect(rec.mildWeightGain).toBeLessThan(rec.weightGain);
      }
    }
  });
});

describe('calculateTDEE: rounding', () => {
  it('returns whole numbers everywhere', () => {
    const inputs = [
      user({ gender: 'female', weight: 61.3, height: 167, age: 33, steps: 7345 }),
      user({ units: 'imperial', weight: 187.4, height: 69, steps: 12001, bodyFat: 13.3 }),
      user({
        calculatorMode: 'advanced',
        bodyFat: 17.7,
        exercises: [exercise('hiit', 'vigorous', 23, 3), exercise('yoga', 'light', 41, 2)],
      }),
    ];
    for (const input of inputs) expectSane(calculateTDEE(input));
  });

  it('rounds maintenance from the unrounded TDEE', () => {
    expect(calculateTDEE(user({ gender: 'female', weight: 60, height: 165, age: 25 })).recommendation.maintain).toBe(1395);
  });

  it('keeps the breakdown within rounding distance of the total', () => {
    const inputs = [
      user({ bodyFat: 12, steps: 8123 }),
      user({ calculatorMode: 'advanced', bodyFat: 10, exercises: [exercise('cardio', 'vigorous', 60, 6)] }),
      user({ gender: 'female', weight: 58, height: 160, bodyFat: 18, steps: 9500, simpleExerciseLevel: 'active' }),
    ];
    for (const input of inputs) {
      const r = calculateTDEE(input);
      expect(Math.abs(componentSum(r) - r.tdee)).toBeLessThanOrEqual(3);
    }
  });
});

describe('calculateTDEE: edge inputs', () => {
  it('treats blank (NaN) steps as 0 instead of returning NaN', () => {
    const r = calculateTDEE(user({ steps: NaN }));
    expect(r.components.neat).toBe(0);
    expect(r.tdee).toBe(1830);
  });

  it('treats negative steps as 0', () => {
    expect(calculateTDEE(user({ steps: -10000 })).components.neat).toBe(0);
  });

  it('never returns NaN or negative values for zero, NaN or absurd core inputs', () => {
    const bad: Partial<UserData>[] = [
      { weight: 0, height: 0, age: 0 },
      { gender: 'female', weight: 0, height: 0, age: 30 },
      { weight: NaN },
      { height: NaN },
      { age: NaN },
      { weight: -80 },
      { height: -180 },
      { age: -30 },
      { age: 500 },
      { weight: Infinity },
      { height: 1000, weight: 1000 },
    ];
    for (const overrides of bad) expectSane(calculateTDEE(user(overrides)));
  });

  it('ignores body fat at or above 100%', () => {
    for (const bodyFat of [100, 150]) {
      const r = calculateTDEE(user({ calculatorMode: 'advanced', bodyFat }));
      expect(r.bmr).toBe(1780);
      expect(r.components.muscleFactor).toBe(0);
    }
  });

  it('ignores negative or NaN body fat', () => {
    for (const bodyFat of [-10, NaN]) {
      for (const mode of ['simple', 'advanced'] as const) {
        const r = calculateTDEE(user({ calculatorMode: mode, bodyFat }));
        expect(r.bmr).toBe(1780);
        expect(r.components.muscleFactor).toBe(0);
      }
    }
  });

  it('treats an unknown job activity as a desk job', () => {
    for (const job of ['astronaut', 'constructor', 'toString']) {
      const r = calculateTDEE(user({ jobActivity: job as unknown as UserData['jobActivity'] }));
      expect(r.components.jobActivity).toBe(50);
      expect(r.tdee).toBe(1830);
    }
  });

  it('does not throw for an unknown gender', () => {
    const odd = user({ gender: 'other' as unknown as UserData['gender'], bodyFat: 12 });
    expectSane(calculateTDEE(odd));
    expect(calculateTDEE(odd).components.muscleFactor).toBe(0);
    expect(() => calculateComparison(odd)).not.toThrow();
    expect(() => calculateMacros(2000, 'custom', odd)).not.toThrow();
  });

  it('treats an unknown simple exercise level as none', () => {
    const r = calculateTDEE(
      user({ simpleExerciseLevel: 'extreme' as unknown as UserData['simpleExerciseLevel'] }),
    );
    expect(r.components.exercise).toBe(0);
    expect(r.tdee).toBe(1830);
  });

  it('skips exercises with an unknown type or intensity instead of throwing', () => {
    const odd = [
      { ...exercise('cardio', 'moderate', 60, 7), type: 'skiing' as unknown as Exercise['type'] },
      { ...exercise('cardio', 'moderate', 60, 7), intensity: 'max' as unknown as Exercise['intensity'] },
      exercise('cardio', 'moderate', 60, 7),
    ];
    const r = calculateTDEE(user({ calculatorMode: 'advanced', exercises: odd }));
    expect(r.components.exercise).toBe(540);
  });

  it('treats NaN or negative minutes and frequency as 0', () => {
    for (const [minutes, frequency] of [[NaN, 3], [60, NaN], [-60, 3], [60, -3]]) {
      const r = calculateTDEE(
        user({ calculatorMode: 'advanced', exercises: [exercise('cardio', 'moderate', minutes, frequency)] }),
      );
      expect(r.components.exercise).toBe(0);
      expectSane(r);
    }
  });

  it('caps frequency at 7 days a week', () => {
    const r = calculateTDEE(
      user({ calculatorMode: 'advanced', exercises: [exercise('cardio', 'moderate', 60, 10)] }),
    );
    expect(r.components.exercise).toBe(540);
  });
});

describe('calculateComparison: standard activity multipliers', () => {
  // Woman, 60 kg, 165 cm, 25: Mifflin-St Jeor 1345.25
  const woman = { gender: 'female' as const, weight: 60, height: 165, age: 25 };
  const levels: Array<[NonNullable<UserData['simpleExerciseLevel']>, number, number]> = [
    ['none', 1.2, 1614],
    ['very_light', 1.375, 1850],
    ['light', 1.375, 1850],
    ['moderate', 1.55, 2085],
    ['active', 1.725, 2321],
    ['very_active', 1.9, 2556],
  ];
  for (const [level, multiplier, expected] of levels) {
    it(`simple level ${level} maps to x${multiplier}`, () => {
      const c = calculateComparison(user({ ...woman, simpleExerciseLevel: level }));
      expect(c.myFitnessPal).toBe(expected);
      expect(c.tdeeCalculatorNet).toBe(expected);
      expect(c.calculatorNet).toBe(expected); // no body fat -> Mifflin
    });
  }

  it('maps advanced-mode sessions per week to a multiplier', () => {
    const cases: Array<[Exercise[], number, number]> = [
      [[], 4000, 1614], // sedentary
      [[], 6000, 1850], // lightly active (steps >= 5000)
      [[exercise('cardio', 'light', 30, 3)], 0, 1850], // lightly active
      [[exercise('cardio', 'light', 30, 4)], 0, 2085], // moderately active
      [[exercise('cardio', 'light', 30, 5)], 0, 2085],
      [[exercise('cardio', 'light', 30, 6)], 0, 2321], // very active
      [[exercise('cardio', 'light', 30, 7)], 0, 2321],
      [[exercise('cardio', 'light', 30, 4), exercise('yoga', 'light', 30, 4)], 0, 2556], // extra active
    ];
    for (const [exercises, steps, expected] of cases) {
      const c = calculateComparison(user({ ...woman, calculatorMode: 'advanced', exercises, steps }));
      expect(c.myFitnessPal).toBe(expected);
    }
  });

  it('uses Katch-McArdle for Calculator.net when body fat is given', () => {
    // 370 + 21.6 * 42 = 1277.2 * 1.2 = 1532.64
    const c = calculateComparison(user({ ...woman, bodyFat: 30 }));
    expect(c.calculatorNet).toBe(1533);
    expect(c.myFitnessPal).toBe(1614);
  });

  it('averages five BMR formulas for Sailrabbit', () => {
    // Mifflin 1780, HB revised 1853.632, HB original 1864.545, Katch and Cunningham fall back to 1780
    expect(calculateComparison(user()).sailrabbit).toBe(2174);
  });

  it('reports our TDEE minus each competitor', () => {
    const c = calculateComparison(user({ steps: 8000, simpleExerciseLevel: 'moderate' }));
    expect(c.ourCalculator).toBe(calculateTDEE(user({ steps: 8000, simpleExerciseLevel: 'moderate' })).tdee);
    expect(c.difference).toEqual({
      calculatorNet: c.ourCalculator - c.calculatorNet,
      myFitnessPal: c.ourCalculator - c.myFitnessPal,
      sailrabbit: c.ourCalculator - c.sailrabbit,
      tdeeCalculatorNet: c.ourCalculator - c.tdeeCalculatorNet,
    });
  });

  it('counts a NaN session frequency as 0 instead of jumping to extra active', () => {
    const c = calculateComparison(
      user({ ...woman, calculatorMode: 'advanced', exercises: [exercise('cardio', 'light', 30, NaN)] }),
    );
    expect(c.myFitnessPal).toBe(1614);
  });

  it('ignores body fat at or above 100%', () => {
    const c = calculateComparison(user({ ...woman, bodyFat: 150 }));
    expect(c.calculatorNet).toBe(1614);
    for (const n of [c.ourCalculator, c.calculatorNet, c.myFitnessPal, c.sailrabbit, c.tdeeCalculatorNet]) {
      expect(Number.isFinite(n)).toBe(true);
      expect(n).toBeGreaterThan(0);
    }
  });
});

describe('calculateMacros', () => {
  function grams(m: MacroSplit) {
    return [m.protein.grams, m.carbs.grams, m.fats.grams];
  }
  function pct(m: MacroSplit) {
    return [m.protein.percentage, m.carbs.percentage, m.fats.percentage];
  }

  it('uses 4 kcal/g for protein and carbs and 9 kcal/g for fat', () => {
    expect(calculateMacros(2000, 'balanced').calories).toBe(2000);
    expect(grams(calculateMacros(2000, 'balanced'))).toEqual([175, 200, 56]);
    expect(grams(calculateMacros(2000, 'low_carb'))).toEqual([150, 125, 100]);
    expect(grams(calculateMacros(2000, 'high_carb'))).toEqual([100, 300, 44]);
    expect(grams(calculateMacros(2000, 'keto'))).toEqual([125, 25, 156]);
  });

  it('keeps the fixed splits', () => {
    expect(pct(calculateMacros(2000, 'balanced'))).toEqual([35, 40, 25]);
    expect(pct(calculateMacros(2000, 'low_carb'))).toEqual([30, 25, 45]);
    expect(pct(calculateMacros(2000, 'high_carb'))).toEqual([20, 60, 20]);
    expect(pct(calculateMacros(2000, 'keto'))).toEqual([25, 5, 70]);
  });

  it('custom without user data falls back to 35/40/25', () => {
    expect(pct(calculateMacros(2000, 'custom'))).toEqual([35, 40, 25]);
  });

  it('custom, losing: at least 35% protein', () => {
    const m = calculateMacros(2000, 'custom', user({ goal: 'lose' }));
    expect(pct(m)).toEqual([35, 40, 25]);
    expect(grams(m)).toEqual([175, 200, 56]);
  });

  it('custom, gaining at 2500+ kcal: 30/45/25', () => {
    expect(pct(calculateMacros(3000, 'custom', user({ goal: 'gain' })))).toEqual([30, 45, 25]);
  });

  it('custom, low maintenance (woman under 1800 kcal): 30/40/30', () => {
    const m = calculateMacros(1700, 'custom', user({ gender: 'female', weight: 60, height: 165, goal: 'maintain' }));
    expect(pct(m)).toEqual([30, 40, 30]);
  });

  it('custom treats imperial and metric weight the same', () => {
    const metric = calculateMacros(2200, 'custom', user({ goal: 'lose' }));
    const imperial = calculateMacros(
      2200,
      'custom',
      user({ goal: 'lose', units: 'imperial', weight: 176.3696, height: 180 / 2.54 }),
    );
    expect(pct(imperial)).toEqual(pct(metric));
  });

  it('custom percentages are whole, bounded and sum to 100', () => {
    for (const calories of [1200, 1500, 2000, 2500, 3500]) {
      for (const goal of ['lose', 'maintain', 'gain', undefined] as const) {
        for (const weight of [50, 80, 120]) {
          for (const bodyFat of [undefined, 12]) {
            const m = calculateMacros(calories, 'custom', user({ goal, weight, bodyFat }));
            const [p, c, f] = pct(m);
            expect(p + c + f).toBe(100);
            for (const x of [p, c, f]) expect(Number.isInteger(x)).toBe(true);
            expect(p).toBeGreaterThanOrEqual(20);
            expect(p).toBeLessThanOrEqual(45);
            expect(f).toBeGreaterThanOrEqual(15);
            expect(f).toBeLessThanOrEqual(50);
            expect(c).toBeGreaterThanOrEqual(5);
          }
        }
      }
    }
  });

  it('never returns NaN for zero, negative or NaN calories', () => {
    for (const calories of [0, -500, NaN]) {
      for (const type of ['balanced', 'custom'] as const) {
        const m = calculateMacros(calories, type, user({ goal: 'lose' }));
        for (const n of [...grams(m), ...pct(m), m.calories]) {
          expect(Number.isFinite(n)).toBe(true);
          expect(n).toBeGreaterThanOrEqual(0);
        }
        expect(pct(m).reduce((a, b) => a + b, 0)).toBe(100);
      }
    }
  });
});
