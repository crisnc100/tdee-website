import { UserData, TDEEResult, ComparisonData, MacroSplit, Exercise } from '@/types/calculator';

// Lowest daily intake a weight-loss target may suggest without medical supervision.
const MIN_LOSS_CALORIES = { male: 1500, female: 1200 };
const DEFAULT_ERROR_MARGIN = 0.07;
const MAX_DAYS_PER_WEEK = 7;

// Blank form fields arrive as NaN; negatives and Infinity are never meaningful here.
function nonNegative(value: number | undefined | null): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

function validBodyFat(bodyFat: number | undefined): number | undefined {
  return typeof bodyFat === 'number' && Number.isFinite(bodyFat) && bodyFat > 0 && bodyFat < 100
    ? bodyFat
    : undefined;
}

// Own-key lookup so stale or unknown values (e.g. from localStorage) can't yield undefined/NaN.
function lookup<T>(table: Record<string, T>, key: string | undefined, fallback: T): T {
  return key !== undefined && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : fallback;
}

function toMetric(userData: UserData): { weight: number; height: number; age: number } {
  const weight = nonNegative(userData.weight);
  const height = nonNegative(userData.height);
  const age = nonNegative(userData.age);
  if (userData.units === 'imperial') {
    return { weight: weight / 2.20462, height: height * 2.54, age }; // lbs -> kg, inches -> cm
  }
  return { weight, height, age };
}

function daysPerWeek(frequency: number | undefined): number {
  return Math.min(nonNegative(frequency), MAX_DAYS_PER_WEEK);
}

function hasLegacyExercise(userData: UserData): boolean {
  return userData.exerciseType != null || userData.exerciseIntensity != null ||
    userData.exerciseMinutes != null || userData.trainingFrequency != null;
}

const exerciseRates: Record<Exercise['type'], Record<Exercise['intensity'], number>> = {
  weight_lifting: { light: 3.5, moderate: 5.5, vigorous: 4.5 },
  cardio: { light: 6, moderate: 9, vigorous: 12.5 },
  hiit: { light: 7, moderate: 10, vigorous: 13.5 },
  yoga: { light: 2.5, moderate: 4, vigorous: 5 },
  sports: { light: 6, moderate: 9, vigorous: 11 }
};

function exerciseRate(type: string, intensity: string): number {
  return lookup(lookup<Record<string, number>>(exerciseRates, type, {}), intensity, 0);
}

// Height-based minimum weight thresholds for muscle mass detection
const muscleWeightThresholds = {
  // Male thresholds (height in cm: min weight in kg)
  male: {
    150: 55, 155: 58, 160: 61, 165: 64, 170: 67, 175: 70, 180: 73, 185: 76, 190: 79, 195: 82, 200: 85
  },
  // Female thresholds (height in cm: min weight in kg) 
  female: {
    145: 45, 150: 47, 155: 49, 160: 51, 165: 53, 170: 55, 175: 57, 180: 59, 185: 61, 190: 63, 195: 65
  }
};

function getMinWeightForHeight(height: number, gender: 'male' | 'female'): number {
  const thresholds = muscleWeightThresholds[gender];
  const heights = Object.keys(thresholds).map(Number).sort((a, b) => a - b);
  
  // Find closest height bracket
  let closestHeight = heights[0];
  for (const h of heights) {
    if (Math.abs(h - height) < Math.abs(closestHeight - height)) {
      closestHeight = h;
    }
  }
  
  return thresholds[closestHeight as keyof typeof thresholds];
}

function isMuscular(weight: number, height: number, gender: 'male' | 'female', bodyFat?: number): boolean {
  if (!bodyFat) return false;
  if (gender !== 'male' && gender !== 'female') return false;
  
  // Check body fat requirements
  const bodyFatThreshold = gender === 'male' ? 15 : 22;
  if (bodyFat >= bodyFatThreshold) return false;
  
  // Check weight requirements
  const minWeight = getMinWeightForHeight(height, gender);
  return weight >= minWeight;
}

function calculateWeeklyExerciseHours(userData: UserData): number {
  // Simple mode takes exercise from simpleExerciseLevel; advanced-mode exercises
  // left in saved state are hidden there and must not count.
  if (userData.calculatorMode === 'simple') return 0;

  if (!userData.exercises || userData.exercises.length === 0) {
    // Fallback to legacy fields
    if (userData.exerciseMinutes && userData.trainingFrequency) {
      return (nonNegative(userData.exerciseMinutes) * daysPerWeek(userData.trainingFrequency)) / 60;
    }
    return 0;
  }

  return userData.exercises.reduce((total, exercise) => {
    return total + ((nonNegative(exercise.minutes) * daysPerWeek(exercise.frequency)) / 60);
  }, 0);
}

export function calculateTDEE(userData: UserData): TDEEResult {
  // Convert imperial units to metric for calculations if needed
  const { weight, height, age } = toMetric(userData); // kg, cm, years
  const bodyFat = validBodyFat(userData.bodyFat);

  // 1. Calculate BMR
  let bmr: number;

  if (userData.calculatorMode === 'advanced' && bodyFat !== undefined) {
    // Advanced mode: Katch-McArdle formula (more accurate with body fat percentage)
    const leanMass = weight * (1 - bodyFat / 100);
    bmr = 370 + (21.6 * leanMass);
  } else {
    // Simple mode or Advanced without body fat: Mifflin-St Jeor formula
    if (userData.gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
  }
  bmr = Math.max(0, bmr);

  // 2. Muscle Factor (automatic detection)
  const muscular = isMuscular(weight, height, userData.gender, bodyFat);
  const muscleFactor = muscular ? 1.05 : 1.0;

  // 3. Job Activity Adder (0-400 calories based on job type)
  const jobActivityMap = {
    desk: 50,
    standing: 100,
    walking: 200,
    physical: 300,
    heavy_physical: 400
  };
  const jobActivity = lookup(jobActivityMap, userData.jobActivity, jobActivityMap.desk);

  // 4. NEAT Calculation: (0.06 × daily_steps × weight_kg) / 100
  const neat = (0.06 * nonNegative(userData.steps) * weight) / 100;

  // 5. Exercise Calculation
  let exerciseCalories: number;
  
  if (userData.calculatorMode === 'simple') {
    // Simple mode: Predefined levels (0-450 cal/day)
    const simpleExerciseMap = {
      none: 0,
      very_light: 75,
      light: 150,
      moderate: 250,
      active: 325,
      very_active: 450
    };
    exerciseCalories = lookup(simpleExerciseMap, userData.simpleExerciseLevel || 'none', 0);
  } else {
    // Advanced mode: Specific kcal/min rates per exercise type (exerciseRates above)
    if (userData.exercises && userData.exercises.length > 0) {
      // New multiple exercise system
      exerciseCalories = userData.exercises.reduce((total, exercise) => {
        const rate = exerciseRate(exercise.type, exercise.intensity);
        const dailyCalories = (rate * nonNegative(exercise.minutes) * daysPerWeek(exercise.frequency)) / 7;
        return total + dailyCalories;
      }, 0);
    } else if (hasLegacyExercise(userData)) {
      // Fallback to legacy single exercise calculation
      const exerciseType = userData.exerciseType || 'weight_lifting';
      const intensity = userData.exerciseIntensity || 'moderate';
      const rate = exerciseRate(exerciseType, intensity);
      const minutes = nonNegative(userData.exerciseMinutes || 60);
      const frequency = daysPerWeek(userData.trainingFrequency || 3);
      const dailyMinutes = (minutes * frequency) / 7;
      exerciseCalories = rate * dailyMinutes;
    } else {
      // Advanced mode with no exercises added
      exerciseCalories = 0;
    }
  }

  // 6. Muscle Activity Boost (+60 cal for muscular individuals exercising 5+ hours/week)
  const weeklyExerciseHours = calculateWeeklyExerciseHours(userData);
  const muscleActivityBoost = (muscular && weeklyExerciseHours >= 5) ? 60 : 0;

  // Calculate total TDEE with muscle factor applied to BMR
  const adjustedBMR = bmr * muscleFactor;
  const tdee = adjustedBMR + jobActivity + neat + exerciseCalories + muscleActivityBoost;

  // 7. Error Margin Range
  let errorPercentage: number;
  const preference = userData.errorMarginPreference;
  if (preference !== undefined && Number.isFinite(preference) && preference > 0 && preference < 100) {
    // Use user's preference
    errorPercentage = preference / 100;
  } else {
    // Default to 7%
    errorPercentage = DEFAULT_ERROR_MARGIN;
  }
  const errorMargin = {
    lower: Math.round(tdee * (1 - errorPercentage)),
    upper: Math.round(tdee * (1 + errorPercentage))
  };

  // Loss targets stop at the floor, and never rise above maintenance when TDEE is already below it.
  const minCalories = userData.gender === 'male' ? MIN_LOSS_CALORIES.male : MIN_LOSS_CALORIES.female;
  const lossTarget = (deficit: number) => Math.round(Math.min(tdee, Math.max(tdee - deficit, minCalories)));

  return {
    bmr: Math.round(adjustedBMR),
    tdee: Math.round(tdee),
    errorMargin,
    components: {
      bmr: Math.round(bmr), // Formula BMR; the muscle bonus is its own line so the breakdown sums to TDEE
      muscleFactor: Math.round(adjustedBMR - bmr), // Show the muscle bonus separately
      jobActivity: Math.round(jobActivity),
      neat: Math.round(neat),
      exercise: Math.round(exerciseCalories),
      muscleRecovery: Math.round(muscleActivityBoost)
    },
    recommendation: {
      maintain: Math.round(tdee),
      mildWeightLoss: lossTarget(250),
      weightLoss: lossTarget(500),
      extremeWeightLoss: lossTarget(750),
      mildWeightGain: Math.round(tdee + 250),
      weightGain: Math.round(tdee + 500)
    }
  };
}

export function calculateComparison(userData: UserData): ComparisonData {
  const ourResult = calculateTDEE(userData);

  // Convert imperial units to metric for calculations if needed
  const { weight, height, age } = toMetric(userData); // kg, cm, years
  const bodyFat = validBodyFat(userData.bodyFat);

  // Mifflin-St Jeor BMR (used by MyFitnessPal, Calculator.net, TDEECalculator.net)
  const mifflinBMR = userData.gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  // Harris-Benedict Revised BMR (alternative formula offered by Calculator.net & Sailrabbit)
  const harrisBenedictBMR = userData.gender === 'male'
    ? 13.397 * weight + 4.799 * height - 5.677 * age + 88.362
    : 9.247 * weight + 3.098 * height - 4.330 * age + 447.593;
  
  // Standard activity multipliers used by all major calculators
  const activityMultipliers = {
    sedentary: 1.2,        // Little to no exercise
    lightly_active: 1.375, // Exercise 1-3 times/week  
    moderately_active: 1.55, // Exercise 3-5 times/week
    very_active: 1.725,    // Exercise 6-7 times/week
    extra_active: 1.9      // Very intense exercise daily
  };
  
  // Determine activity level for comparison calculators
  // Map our detailed system to their simple activity levels
  let activityLevel: keyof typeof activityMultipliers = 'moderately_active';
  
  if (userData.calculatorMode === 'simple') {
    // Map our exercise levels to standard activity levels
    switch(userData.simpleExerciseLevel) {
      case 'none': activityLevel = 'sedentary'; break;
      case 'very_light': activityLevel = 'lightly_active'; break;
      case 'light': activityLevel = 'lightly_active'; break;
      case 'moderate': activityLevel = 'moderately_active'; break;
      case 'active': activityLevel = 'very_active'; break;
      case 'very_active': activityLevel = 'extra_active'; break;
      default: activityLevel = 'moderately_active';
    }
  } else {
    // For advanced mode, calculate total weekly exercise sessions
    const weeklyExerciseSessions = userData.exercises?.reduce((total, ex) => total + daysPerWeek(ex.frequency), 0) || 0;
    const jobIsActive = userData.jobActivity === 'physical' || userData.jobActivity === 'heavy_physical';
    const steps = nonNegative(userData.steps);

    if (weeklyExerciseSessions === 0 && !jobIsActive && steps < 5000) {
      activityLevel = 'sedentary';
    } else if (weeklyExerciseSessions <= 3 && !jobIsActive) {
      activityLevel = 'lightly_active'; 
    } else if (weeklyExerciseSessions <= 5 || (weeklyExerciseSessions <= 3 && jobIsActive)) {
      activityLevel = 'moderately_active';
    } else if (weeklyExerciseSessions <= 7 || (weeklyExerciseSessions <= 5 && jobIsActive)) {
      activityLevel = 'very_active';
    } else {
      activityLevel = 'extra_active';
    }
  }
  
  // Calculate additional BMR formulas first
  // Harris-Benedict Original BMR (older formula)
  const harrisOriginalBMR = userData.gender === 'male'
    ? 66.4730 + (13.7516 * weight) + (5.0033 * height) - (6.7550 * age)
    : 655.0955 + (9.5634 * weight) + (1.8496 * height) - (4.6756 * age);

  // Katch-McArdle (if body fat available)
  let katchBMR = mifflinBMR; // Fallback to Mifflin if no body fat
  if (bodyFat !== undefined) {
    const leanMass = weight * (1 - bodyFat / 100);
    katchBMR = 370 + (21.6 * leanMass);
  }

  // Cunningham formula (athletic)
  const cunninghamBMR = bodyFat !== undefined
    ? 500 + (22 * (weight * (1 - bodyFat / 100)))
    : mifflinBMR; // Fallback if no body fat

  // Now calculate each calculator's TDEE (BMR clamped at 0 so absurd inputs can't go negative)
  const estimate = (bmr: number) => Math.round(Math.max(0, bmr) * activityMultipliers[activityLevel]);

  // MyFitnessPal: Mifflin-St Jeor with standard multipliers
  const myFitnessPal = estimate(mifflinBMR);

  // Calculator.net: Mifflin-St Jeor (default) OR Katch-McArdle if body fat provided
  const calculatorNetBMR = bodyFat !== undefined ? katchBMR : mifflinBMR;
  const calculatorNet = estimate(calculatorNetBMR);

  // Sailrabbit: Average of multiple BMR formulas (they use 5+ formulas)
  const sailrabbitBMRs = [mifflinBMR, harrisBenedictBMR, harrisOriginalBMR, katchBMR, cunninghamBMR];
  const sailrabbitAvg = estimate(sailrabbitBMRs.reduce((a, b) => a + b) / sailrabbitBMRs.length);

  // TDEECalculator.net: Mifflin-St Jeor with standard multipliers
  const tdeeCalculatorNet = estimate(mifflinBMR);

  return {
    ourCalculator: ourResult.tdee,
    calculatorNet,
    myFitnessPal,
    sailrabbit: sailrabbitAvg,
    tdeeCalculatorNet,
    difference: {
      calculatorNet: ourResult.tdee - calculatorNet,
      myFitnessPal: ourResult.tdee - myFitnessPal,
      sailrabbit: ourResult.tdee - sailrabbitAvg,
      tdeeCalculatorNet: ourResult.tdee - tdeeCalculatorNet
    }
  };
}

function calculateSmartMacros(calories: number, userData?: UserData): { protein: number; carbs: number; fats: number } {
  if (!userData || !(calories > 0)) {
    // Fallback to balanced if no user data (or no calories to split)
    return { protein: 35, carbs: 40, fats: 25 };
  }

  // Convert weight to lbs if needed for protein calculation
  let weightLbs = nonNegative(userData.weight);
  if (userData.units === 'metric') {
    weightLbs = weightLbs * 2.20462; // kg to lbs
  }

  // Determine if user is muscular (from TDEE calculation logic)
  const { weight, height } = toMetric(userData);
  const muscular = isMuscular(weight, height, userData.gender, validBodyFat(userData.bodyFat));

  // Determine activity level
  const weeklyExerciseHours = calculateWeeklyExerciseHours(userData);
  const highActivity = weeklyExerciseHours >= 5;

  // Check for low maintenance calories (potential issue)
  const lowMaintenance = (userData.gender === 'male' && calories < 2200) || 
                        (userData.gender === 'female' && calories < 1800);

  // Smart macro logic based on goal and context
  let protein: number, carbs: number, fats: number;

  // Base protein on body weight and goal
  const baseProteinGrams = Math.max(weightLbs * 0.75, 100); // Minimum 100g
  let targetProteinPercentage = Math.round((baseProteinGrams * 4 / calories) * 100);

  // Adjust protein based on context
  if (userData.goal === 'lose') {
    // Higher protein for weight loss (35-40%)
    targetProteinPercentage = Math.max(targetProteinPercentage, 35);
    if (muscular || highActivity) targetProteinPercentage = Math.min(targetProteinPercentage + 5, 40);
    
    protein = targetProteinPercentage;
    carbs = Math.min(45 - (targetProteinPercentage - 35) * 2, 40); // 30-40% carbs
    fats = 100 - protein - carbs; // Remaining for fats (20-30%)
    
  } else if (userData.goal === 'gain') {
    // At least 30% protein, adjust based on needs
    targetProteinPercentage = Math.max(targetProteinPercentage, 30);
    
    protein = Math.min(targetProteinPercentage, 35); // Cap at 35% for surplus
    
    if (calories < 2500) {
      // Struggling to gain - higher fats for caloric density
      fats = 35;
      carbs = 100 - protein - fats;
    } else if (highActivity) {
      // High activity - more carbs for energy
      carbs = 50;
      fats = 100 - protein - carbs;
    } else {
      // Balanced approach for gaining
      carbs = 45;
      fats = 100 - protein - carbs;
    }
    
  } else {
    // Maintain - most flexible, based on preferences and activity
    if (lowMaintenance) {
      // Low maintenance calories - need efficiency
      protein = Math.max(targetProteinPercentage, 30);
      fats = 30; // Higher fats for satiety and hormones
      carbs = 100 - protein - fats;
    } else if (highActivity) {
      // High activity - fuel performance
      protein = Math.max(targetProteinPercentage, 25);
      carbs = 50;
      fats = 100 - protein - carbs;
    } else {
      // Standard maintenance - balanced approach
      protein = Math.max(targetProteinPercentage, 30);
      carbs = 40;
      fats = 100 - protein - carbs;
    }
  }

  // Ensure percentages are reasonable and sum to 100
  protein = Math.max(20, Math.min(protein, 45)); // 20-45%
  fats = Math.max(15, Math.min(fats, 50)); // 15-50%  
  carbs = 100 - protein - fats; // Remaining
  carbs = Math.max(5, carbs); // Minimum 5% carbs

  // Final adjustment to ensure they sum to exactly 100
  const total = protein + carbs + fats;
  if (total !== 100) {
    const diff = 100 - total;
    carbs += diff; // Adjust carbs for any rounding errors
  }

  return { protein, carbs, fats };
}

export function calculateMacros(rawCalories: number, type: MacroSplit['type'], userData?: UserData): MacroSplit {
  const calories = nonNegative(rawCalories);
  let proteinPercentage: number;
  let carbsPercentage: number;
  let fatsPercentage: number;

  switch (type) {
    case 'balanced':
      proteinPercentage = 35;
      carbsPercentage = 40;
      fatsPercentage = 25;
      break;
    case 'low_carb':
      proteinPercentage = 30;
      carbsPercentage = 25;
      fatsPercentage = 45;
      break;
    case 'high_carb':
      proteinPercentage = 20;
      carbsPercentage = 60;
      fatsPercentage = 20;
      break;
    case 'keto':
      proteinPercentage = 25;
      carbsPercentage = 5;
      fatsPercentage = 70;
      break;
    case 'custom':
      // Smart logic for MyCalorieLog recommendation
      const smartMacros = calculateSmartMacros(calories, userData);
      proteinPercentage = smartMacros.protein;
      carbsPercentage = smartMacros.carbs;
      fatsPercentage = smartMacros.fats;
      break;
  }

  return {
    type,
    calories,
    protein: {
      grams: Math.round((calories * proteinPercentage / 100) / 4),
      percentage: proteinPercentage
    },
    carbs: {
      grams: Math.round((calories * carbsPercentage / 100) / 4),
      percentage: carbsPercentage
    },
    fats: {
      grams: Math.round((calories * fatsPercentage / 100) / 9),
      percentage: fatsPercentage
    }
  };
}

export function generateShareableId(): string {
  return Math.random().toString(36).substring(2, 8);
}