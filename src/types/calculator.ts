export interface Exercise {
  id: string;
  type: 'weight_lifting' | 'cardio' | 'hiit' | 'yoga' | 'sports';
  intensity: 'light' | 'moderate' | 'vigorous';
  minutes: number;
  frequency: number; // days per week
}

export interface UserData {
  // Basic fields (both simple and advanced)
  age: number;
  gender: 'male' | 'female';
  units: 'metric' | 'imperial';
  weight: number; // kg for metric, lbs for imperial
  height: number; // cm for metric, total inches for imperial
  heightFeet?: number; // feet for imperial display
  heightInches?: number; // remaining inches for imperial display
  jobActivity: 'desk' | 'standing' | 'walking' | 'physical' | 'heavy_physical';
  steps: number;
  goal?: 'lose' | 'maintain' | 'gain'; // User's fitness goal
  
  // Mode selector
  calculatorMode: 'simple' | 'advanced';
  
  // Simple mode exercise
  simpleExerciseLevel?: 'none' | 'very_light' | 'light' | 'moderate' | 'active' | 'very_active';
  
  // Advanced mode fields
  bodyFat?: number; // percentage
  errorMarginPreference?: number; // percentage (10-20)
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  exercises?: Exercise[];
  muscleMass?: 'low' | 'average' | 'high';
  trainingFrequency?: number; // days per week
  
  // Legacy fields for backward compatibility
  exerciseMinutes?: number;
  exerciseIntensity?: 'light' | 'moderate' | 'vigorous';
  exerciseType?: 'weight_lifting' | 'cardio' | 'hiit' | 'yoga' | 'sports';
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  errorMargin: {
    lower: number;
    upper: number;
  };
  components: {
    bmr: number;
    muscleFactor: number;
    jobActivity: number;
    neat: number;
    exercise: number;
    muscleRecovery: number;
  };
  recommendation: {
    maintain: number;
    mildWeightLoss: number;
    weightLoss: number;
    extremeWeightLoss: number;
    mildWeightGain: number;
    weightGain: number;
  };
}

export interface ComparisonData {
  ourCalculator: number;
  calculatorNet: number;
  myFitnessPal: number;
  sailrabbit: number;
  tdeeCalculatorNet: number;
  difference: {
    calculatorNet: number;
    myFitnessPal: number;
    sailrabbit: number;
    tdeeCalculatorNet: number;
  };
}

export interface MacroSplit {
  type: 'balanced' | 'low_carb' | 'high_carb' | 'keto';
  calories: number;
  protein: { grams: number; percentage: number };
  carbs: { grams: number; percentage: number };
  fats: { grams: number; percentage: number };
}

export interface MealSuggestion {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  image?: string;
}

export interface TrackingData {
  date: string;
  weight: number;
  tdee: number;
  goal: 'lose' | 'maintain' | 'gain';
}