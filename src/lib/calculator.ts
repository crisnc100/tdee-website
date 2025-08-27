import { UserData, TDEEResult, ComparisonData, MacroSplit } from '@/types/calculator';

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
  
  // Check body fat requirements
  const bodyFatThreshold = gender === 'male' ? 15 : 22;
  if (bodyFat >= bodyFatThreshold) return false;
  
  // Check weight requirements
  const minWeight = getMinWeightForHeight(height, gender);
  return weight >= minWeight;
}

function calculateWeeklyExerciseHours(userData: UserData): number {
  if (!userData.exercises || userData.exercises.length === 0) {
    // Fallback to legacy fields
    if (userData.exerciseMinutes && userData.trainingFrequency) {
      return (userData.exerciseMinutes * userData.trainingFrequency) / 60;
    }
    return 0;
  }
  
  return userData.exercises.reduce((total, exercise) => {
    return total + ((exercise.minutes * exercise.frequency) / 60);
  }, 0);
}

export function calculateTDEE(userData: UserData): TDEEResult {
  // Convert imperial units to metric for calculations if needed
  let weight = userData.weight; // kg
  let height = userData.height; // cm
  
  if (userData.units === 'imperial') {
    weight = userData.weight / 2.20462; // lbs to kg
    height = userData.height * 2.54; // inches to cm
  }

  // 1. Calculate BMR
  let bmr: number;
  
  if (userData.calculatorMode === 'advanced' && userData.bodyFat && userData.bodyFat > 0) {
    // Advanced mode: Katch-McArdle formula (more accurate with body fat percentage)
    const leanMass = weight * (1 - userData.bodyFat / 100);
    bmr = 370 + (21.6 * leanMass);
  } else {
    // Simple mode or Advanced without body fat: Mifflin-St Jeor formula
    if (userData.gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * userData.age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * userData.age - 161;
    }
  }

  // 2. Muscle Factor (automatic detection)
  const muscular = isMuscular(weight, height, userData.gender, userData.bodyFat);
  const muscleFactor = muscular ? 1.05 : 1.0;

  // 3. Job Activity Adder (0-400 calories based on job type)
  const jobActivityMap = {
    desk: 50,
    standing: 100,
    walking: 200,
    physical: 300,
    heavy_physical: 400
  };
  const jobActivity = jobActivityMap[userData.jobActivity];

  // 4. NEAT Calculation: (0.06 × daily_steps × weight_kg) / 100
  const neat = (0.06 * userData.steps * weight) / 100;

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
    exerciseCalories = simpleExerciseMap[userData.simpleExerciseLevel || 'none'];
  } else {
    // Advanced mode: Specific kcal/min rates per exercise type
    const exerciseRates = {
      weight_lifting: { light: 3.5, moderate: 5.5, vigorous: 4.5 },
      cardio: { light: 6, moderate: 9, vigorous: 12.5 },
      hiit: { light: 7, moderate: 10, vigorous: 13.5 },
      yoga: { light: 2.5, moderate: 4, vigorous: 5 },
      sports: { light: 6, moderate: 9, vigorous: 11 }
    };

    if (userData.exercises && userData.exercises.length > 0) {
      // New multiple exercise system
      exerciseCalories = userData.exercises.reduce((total, exercise) => {
        const rate = exerciseRates[exercise.type][exercise.intensity];
        const dailyCalories = (rate * exercise.minutes * exercise.frequency) / 7;
        return total + dailyCalories;
      }, 0);
    } else {
      // Fallback to legacy single exercise calculation
      const exerciseType = userData.exerciseType || 'weight_lifting';
      const intensity = userData.exerciseIntensity || 'moderate';
      const rate = exerciseRates[exerciseType][intensity];
      const minutes = userData.exerciseMinutes || 60;
      const frequency = userData.trainingFrequency || 3;
      const dailyMinutes = (minutes * frequency) / 7;
      exerciseCalories = rate * dailyMinutes;
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
  if (userData.errorMarginPreference) {
    // Use user's preference
    errorPercentage = userData.errorMarginPreference / 100;
  } else {
    // Default to 7%
    errorPercentage = 0.07;
  }
  const errorMargin = {
    lower: Math.round(tdee * (1 - errorPercentage)),
    upper: Math.round(tdee * (1 + errorPercentage))
  };

  return {
    bmr: Math.round(adjustedBMR),
    tdee: Math.round(tdee),
    errorMargin,
    components: {
      bmr: Math.round(adjustedBMR),
      muscleFactor: Math.round(adjustedBMR - bmr), // Show the muscle bonus separately
      jobActivity: Math.round(jobActivity),
      neat: Math.round(neat),
      exercise: Math.round(exerciseCalories),
      muscleRecovery: Math.round(muscleActivityBoost)
    },
    recommendation: {
      maintain: Math.round(tdee),
      mildWeightLoss: Math.round(tdee - 250),
      weightLoss: Math.round(tdee - 500),
      extremeWeightLoss: Math.round(tdee - 750),
      mildWeightGain: Math.round(tdee + 250),
      weightGain: Math.round(tdee + 500)
    }
  };
}

export function calculateComparison(userData: UserData): ComparisonData {
  const ourResult = calculateTDEE(userData);
  
  // Convert imperial units to metric for calculations if needed
  let weight = userData.weight; // kg
  let height = userData.height; // cm
  
  if (userData.units === 'imperial') {
    weight = userData.weight / 2.20462; // lbs to kg
    height = userData.height * 2.54; // inches to cm
  }
  
  // Mifflin-St Jeor BMR (used by MyFitnessPal, Calculator.net, TDEECalculator.net)
  const mifflinBMR = userData.gender === 'male' 
    ? 10 * weight + 6.25 * height - 5 * userData.age + 5
    : 10 * weight + 6.25 * height - 5 * userData.age - 161;
  
  // Harris-Benedict Revised BMR (alternative formula offered by Calculator.net & Sailrabbit)
  const harrisBenedictBMR = userData.gender === 'male'
    ? 13.397 * weight + 4.799 * height - 5.677 * userData.age + 88.362
    : 9.247 * weight + 3.098 * height - 4.330 * userData.age + 447.593;
  
  // Standard activity multipliers used by all major calculators
  const activityMultipliers = {
    sedentary: 1.2,        // Little to no exercise
    lightly_active: 1.375, // Exercise 1-3 times/week  
    moderately_active: 1.55, // Exercise 3-5 times/week
    very_active: 1.725,    // Exercise 6-7 times/week
    extra_active: 1.9      // Very intense exercise daily
  };
  
  // Determine activity level for comparison calculators
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
    // For advanced mode, calculate based on exercise frequency
    const exerciseCount = userData.exercises?.length || 0;
    const totalSteps = userData.steps || 5000;
    
    if (exerciseCount === 0 && totalSteps < 5000) {
      activityLevel = 'sedentary';
    } else if (exerciseCount <= 2 || totalSteps < 7500) {
      activityLevel = 'lightly_active';
    } else if (exerciseCount <= 4 || totalSteps < 10000) {
      activityLevel = 'moderately_active';
    } else if (exerciseCount <= 6 || totalSteps < 12500) {
      activityLevel = 'very_active';
    } else {
      activityLevel = 'extra_active';
    }
  }
  
  // MyFitnessPal: Mifflin-St Jeor with standard multipliers
  const myFitnessPal = Math.round(mifflinBMR * activityMultipliers[activityLevel]);
  
  // Calculator.net: Mifflin-St Jeor (default) with standard multipliers
  const calculatorNet = Math.round(mifflinBMR * activityMultipliers[activityLevel]);
  
  // Sailrabbit: Average of multiple formulas (Mifflin + Harris-Benedict)
  // They average multiple formulas for more accuracy
  const sailrabbitAvg = Math.round(((mifflinBMR + harrisBenedictBMR) / 2) * activityMultipliers[activityLevel]);
  
  // TDEECalculator.net: Mifflin-St Jeor with standard multipliers
  const tdeeCalculatorNet = Math.round(mifflinBMR * activityMultipliers[activityLevel]);

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

export function calculateMacros(calories: number, type: MacroSplit['type']): MacroSplit {
  let proteinPercentage: number;
  let carbsPercentage: number;
  let fatsPercentage: number;

  switch (type) {
    case 'balanced':
      proteinPercentage = 25;
      carbsPercentage = 45;
      fatsPercentage = 30;
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