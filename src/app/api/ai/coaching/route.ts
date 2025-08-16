import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter, createTDEEPrompt } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const { userData, tdeeResult } = await request.json();

    if (!userData || !tdeeResult) {
      return NextResponse.json(
        { error: 'Missing user data or TDEE results' },
        { status: 400 }
      );
    }

    // Fallback to rule-based coaching if OpenRouter is not configured
    if (!process.env.OPENROUTER_API_KEY) {
      const fallbackTips = generateFallbackCoaching(userData, tdeeResult);
      return NextResponse.json({
        tips: fallbackTips,
        source: 'rule-based'
      });
    }

    try {
      // Use AI for personalized coaching
      const prompt = createTDEEPrompt(userData, tdeeResult);
      
      const aiResponse = await callOpenRouter([
        {
          role: 'system',
          content: 'You are an expert personal trainer and nutritionist providing personalized coaching advice.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.8, // More creative for coaching
        max_tokens: 600
      });

      // Parse AI response into structured tips
      const tips = parseCoachingResponse(aiResponse);

      return NextResponse.json({
        tips,
        source: 'ai',
        model: 'claude-3.5-sonnet'
      });

    } catch (aiError) {
      console.error('AI coaching error:', aiError);
      
      // Fallback to rule-based if AI fails
      const fallbackTips = generateFallbackCoaching(userData, tdeeResult);
      return NextResponse.json({
        tips: fallbackTips,
        source: 'rule-based-fallback'
      });
    }

  } catch (error) {
    console.error('Error generating coaching:', error);
    return NextResponse.json(
      { error: 'Failed to generate coaching advice' },
      { status: 500 }
    );
  }
}

function parseCoachingResponse(aiResponse: string): string[] {
  // Extract numbered points or bullet points from AI response
  const lines = aiResponse.split('\n').filter(line => line.trim());
  const tips: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match numbered lists (1., 2., etc.) or bullet points (-, *, •)
    if (/^(\d+\.|[-*•]|\*\*)/.test(trimmed)) {
      const cleanTip = trimmed
        .replace(/^\d+\.\s*/, '') // Remove numbers
        .replace(/^[-*•]\s*/, '') // Remove bullets
        .replace(/^\*\*|\*\*$/g, '') // Remove bold markers
        .trim();
      
      if (cleanTip.length > 20) { // Only substantial tips
        tips.push(cleanTip);
      }
    }
  }

  // If parsing fails, split by periods and take meaningful sentences
  if (tips.length === 0) {
    const sentences = aiResponse.split('.').filter(s => s.trim().length > 30);
    return sentences.slice(0, 4).map(s => s.trim() + '.');
  }

  return tips.slice(0, 4); // Limit to 4 tips
}

function generateFallbackCoaching(userData: any, tdeeResult: any): string[] {
  const tips: string[] = [];
  
  // Calculate weekly exercise hours and weight in lbs for protein calculations
  const weeklyHours = userData.exercises?.reduce((total: number, ex: any) => 
    total + ((ex.minutes * ex.frequency) / 60), 0) || 0;
  
  const weightLbs = userData.units === 'metric' ? userData.weight * 2.20462 : userData.weight;
  const optimalProtein = Math.round(weightLbs * 0.75); // 0.75g per lb
  const highProtein = Math.round(weightLbs); // 1g per lb
  
  // Protein-specific advice based on goal and weight
  if (userData.goal === 'lose') {
    tips.push(`🥩 Protein Target: ${highProtein}g daily (1g/lb) for weight loss. This higher amount helps you stay full and preserves muscle during your cut. Recent studies show ${optimalProtein}g (0.75g/lb) is sufficient for muscle growth, but the extra protein aids satiety.`);
  } else if (userData.goal === 'gain') {
    tips.push(`🥩 Protein Target: ${optimalProtein}-${highProtein}g daily (0.75-1g/lb). For weight gain, ${optimalProtein}g is optimal since protein is very filling. Only go higher if you're a serious athlete or struggling to eat enough calories.`);
  } else if (weightLbs >= 140) { // Only show for reasonable weights
    tips.push(`🥩 Protein Target: ${optimalProtein}-${highProtein}g daily. Recent research suggests ${optimalProtein}g (0.75g/lb) is optimal for muscle protein synthesis. The traditional 1g/lb (${highProtein}g) provides extra satiety benefits.`);
  }
  
  // Job activity insights
  if (userData.jobActivity === 'desk' && userData.steps < 8000) {
    tips.push("💼 Set hourly reminders to walk for 2-3 minutes to boost your NEAT and energy levels throughout the day.");
  }
  
  // Exercise-specific advice
  if (weeklyHours >= 5) {
    tips.push("🏋️ With your high training volume, prioritize sleep (7-9 hours) and consider a deload week every 4-6 weeks for recovery.");
  } else if (weeklyHours < 2) {
    tips.push("🚀 Adding just 30 minutes of resistance training twice a week could increase your TDEE by 100-150 calories daily.");
  }
  
  // Age-specific advice
  if (userData.age >= 40) {
    tips.push("⏰ Focus on protein timing: aim for 25-30g protein per meal to maximize muscle protein synthesis at your age.");
  } else if (userData.age < 25) {
    tips.push("🌟 Your age gives you great recovery potential - this is the perfect time to build sustainable exercise habits that will pay dividends for life.");
  }
  
  // Default motivational tip if we don't have enough specific ones
  if (tips.length < 3) {
    tips.push("🎯 Your TDEE of " + tdeeResult.tdee + " calories gives you flexibility - small consistent changes compound into significant results over time.");
  }
  
  return tips.slice(0, 4);
}