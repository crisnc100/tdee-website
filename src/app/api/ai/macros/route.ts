import { NextRequest, NextResponse } from 'next/server';
import { calculateMacros } from '@/lib/calculator';
import { MacroSplit } from '@/types/calculator';

export async function POST(request: NextRequest) {
  try {
    const { calories, goal, userData } = await request.json();

    if (!calories || calories < 800 || calories > 5000) {
      return NextResponse.json(
        { error: 'Invalid calorie amount' },
        { status: 400 }
      );
    }

    const macroTypes: MacroSplit['type'][] = ['balanced', 'low_carb', 'high_carb', 'keto'];
    const results = macroTypes.map(type => calculateMacros(calories, type));

    // AI-powered recommendation based on user profile
    const recommendedIndex = getPersonalizedRecommendation(goal, userData);
    const personalizedMessage = getPersonalizedMessage(goal, results[recommendedIndex], userData);

    return NextResponse.json({
      macros: results,
      recommended: recommendedIndex,
      message: personalizedMessage,
      insights: getPersonalizedInsights(userData, goal)
    });

  } catch (error) {
    console.error('Error calculating macros:', error);
    return NextResponse.json(
      { error: 'Failed to calculate macros' },
      { status: 500 }
    );
  }
}

function getPersonalizedRecommendation(goal: string, userData: any): number {
  // Default recommendations
  let baseRecommendation = 0; // balanced
  if (goal === 'lose') baseRecommendation = 1; // low_carb
  if (goal === 'gain') baseRecommendation = 2; // high_carb

  // AI adjustments based on user profile
  if (userData) {
    // High exercise volume? Favor carbs for performance
    const weeklyExerciseHours = calculateWeeklyHours(userData.exercises || []);
    if (weeklyExerciseHours >= 6 && goal !== 'lose') {
      return 2; // high_carb for performance
    }

    // Strength training focused? Balanced approach with adequate protein
    const strengthTraining = hasStrengthTraining(userData.exercises || []);
    if (strengthTraining && goal === 'maintain') {
      return 0; // balanced
    }

    // Older users (40+) with weight loss goals? More gentle approach
    if (userData.age >= 40 && goal === 'lose') {
      return 0; // balanced instead of aggressive low-carb
    }

    // Very active lifestyle (high steps + exercise)? Need carbs
    if (userData.steps > 12000 && weeklyExerciseHours >= 4) {
      return goal === 'lose' ? 0 : 2; // balanced for loss, high-carb for others
    }
  }

  return baseRecommendation;
}

function getPersonalizedMessage(goal: string, macro: MacroSplit, userData: any): string {
  const weeklyHours = userData ? calculateWeeklyHours(userData.exercises || []) : 0;
  const hasStrength = userData ? hasStrengthTraining(userData.exercises || []) : false;
  const highSteps = userData ? userData.steps > 10000 : false;

  let message = `Based on your ${goal} goal`;
  
  if (userData) {
    if (weeklyHours >= 6) message += ` and high training volume (${weeklyHours}h/week)`;
    else if (weeklyHours >= 3) message += ` and moderate training`;
    
    if (hasStrength) message += ` with strength training`;
    if (highSteps) message += ` and active lifestyle (${userData.steps.toLocaleString()} steps)`;
  }

  message += `, we recommend ${macro.protein.grams}g protein, ${macro.carbs.grams}g carbs, and ${macro.fats.grams}g fats.`;

  // Add specific insights
  if (goal === 'lose' && hasStrength) {
    message += ` Higher protein preserves muscle during your cut.`;
  } else if (goal === 'gain' && weeklyHours >= 5) {
    message += ` Extra carbs fuel your intense training sessions.`;
  } else if (highSteps && weeklyHours >= 4) {
    message += ` Your active lifestyle requires adequate carbohydrates for energy.`;
  }

  return message;
}

function getPersonalizedInsights(userData: any, goal: string): string[] {
  const insights: string[] = [];
  
  if (!userData) return insights;

  const weeklyHours = calculateWeeklyHours(userData.exercises || []);
  const hasStrength = hasStrengthTraining(userData.exercises || []);
  const hasCardio = hasCardioTraining(userData.exercises || []);

  // Training-specific insights
  if (hasStrength && goal === 'gain') {
    insights.push("💪 Eat protein within 2 hours post-workout for optimal muscle growth");
  }
  
  if (hasCardio && userData.steps > 12000) {
    insights.push("🏃 Your high activity level means you can handle more carbs without fat gain");
  }

  // Age-specific insights
  if (userData.age >= 40) {
    insights.push("⏰ Consider spreading protein intake throughout the day for better muscle retention");
  }

  // Goal-specific insights
  if (goal === 'lose' && weeklyHours >= 4) {
    insights.push("🔥 Don't cut calories too aggressively - your training demands adequate fuel");
  }

  // Lifestyle insights
  if (userData.jobActivity === 'desk' && userData.steps < 6000) {
    insights.push("🖥️ Consider timing carbs around workouts since you're mostly sedentary");
  }

  return insights;
}

function calculateWeeklyHours(exercises: any[]): number {
  return exercises.reduce((total, ex) => total + ((ex.minutes * ex.frequency) / 60), 0);
}

function hasStrengthTraining(exercises: any[]): boolean {
  return exercises.some(ex => ex.type === 'weight_lifting');
}

function hasCardioTraining(exercises: any[]): boolean {
  return exercises.some(ex => ['cardio', 'hiit'].includes(ex.type));
}

function getRecommendationMessage(goal: string, macro: MacroSplit): string {
  switch (goal) {
    case 'lose':
      return `For weight loss, we recommend lower carbs (${macro.carbs.grams}g) and higher protein (${macro.protein.grams}g) to preserve muscle mass while in a deficit.`;
    case 'gain':
      return `For muscle gain, we recommend higher carbs (${macro.carbs.grams}g) to fuel your workouts and adequate protein (${macro.protein.grams}g) for recovery.`;
    default:
      return `For maintenance, a balanced approach with ${macro.protein.grams}g protein, ${macro.carbs.grams}g carbs, and ${macro.fats.grams}g fats works well.`;
  }
}