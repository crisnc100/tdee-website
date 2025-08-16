interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export async function callOpenRouter(
  messages: OpenRouterRequest['messages'],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  // Default to Claude 3.5 Sonnet for best performance/cost balance
  const model = options.model || 'anthropic/claude-3.5-sonnet';
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://tdee-calculator.com',
      'X-Title': process.env.OPENROUTER_APP_NAME || 'TDEE Calculator Pro',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data: OpenRouterResponse = await response.json();
  
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Invalid response from OpenRouter API');
  }

  return data.choices[0].message.content;
}

export function createTDEEPrompt(userData: any, tdeeResult: any): string {
  return `You are a certified personal trainer and nutrition expert. Analyze this person's TDEE data and provide personalized coaching insights.

USER PROFILE:
- Age: ${userData.age}, Gender: ${userData.gender}
- Weight: ${userData.weight}${userData.units === 'metric' ? 'kg' : 'lbs'}
- Height: ${userData.units === 'metric' ? userData.height + 'cm' : userData.heightFeet + "'" + userData.heightInches + '"'}
- Job: ${userData.jobActivity} (${userData.steps} daily steps)
- Body Fat: ${userData.bodyFat || 'Unknown'}%
- Exercise: ${userData.exercises?.map(ex => `${ex.type} ${ex.intensity} ${ex.minutes}min ${ex.frequency}x/week`).join(', ') || userData.simpleExerciseLevel || 'None specified'}

CALCULATED RESULTS:
- TDEE: ${tdeeResult.tdee} calories
- BMR: ${tdeeResult.bmr} calories  
- Components: BMR(${tdeeResult.components.bmr}) + Job(${tdeeResult.components.jobActivity}) + Steps(${tdeeResult.components.neat}) + Exercise(${tdeeResult.components.exercise}) + Recovery(${tdeeResult.components.muscleRecovery})

TASK: Provide 3-4 actionable, personalized coaching tips in a motivational tone. Focus on:
1. Protein intake recommendations (0.75g/lb optimal, 1g/lb for weight loss satiety)
2. Lifestyle optimization for their specific job/activity level  
3. Exercise recommendations that complement their current routine
4. One motivational insight about their progress potential

PROTEIN CONTEXT: Recent research shows 0.75g per lb bodyweight is optimal for muscle protein synthesis for most people. Traditional 1g/lb recommendations provide extra satiety benefits, especially useful for weight loss. For weight gain, lower protein prevents excessive fullness.

Keep each tip to 1-2 sentences. Be specific and actionable, not generic.`;
}

export function createMealAdaptationPrompt(
  targetCalories: number, 
  targetMacros: { protein: number; carbs: number; fats: number },
  baseRecipe: any,
  userData: any
): string {
  return `You are a nutrition expert. Adapt this recipe to meet specific macro targets while keeping it delicious.

TARGET: ${targetCalories} calories, ${targetMacros.protein}g protein, ${targetMacros.carbs}g carbs, ${targetMacros.fats}g fats

BASE RECIPE:
${baseRecipe.name} (${baseRecipe.calories} cal, ${baseRecipe.protein}g P, ${baseRecipe.carbs}g C, ${baseRecipe.fats}g F)
Ingredients: ${baseRecipe.ingredients.join(', ')}
Instructions: ${baseRecipe.instructions.join('. ')}

USER CONTEXT:
- Goal: ${userData.goal || 'maintenance'}
- Activity: ${userData.exercises?.length > 0 ? 'Active' : 'Moderate'}
- Preferences: ${userData.dietaryPreferences?.join(', ') || 'None specified'}

TASK: Modify the recipe by adjusting portions or substituting ingredients to hit the macro targets. Provide:
1. Updated ingredient list with quantities
2. New macro breakdown
3. Any cooking adjustments needed
4. One tip for meal timing based on their activity level

Keep the recipe practical and tasty.`;
}