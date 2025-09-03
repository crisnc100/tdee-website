import { NextRequest, NextResponse } from 'next/server';
import { getNutritionCoaching } from '@/lib/aiService';
import { selectOptimalModel, getCostOptimizationRecommendations } from '@/lib/modelSelector';
import { DEFAULT_USER_PREFERENCES, AIModelId, UserAIPreferences } from '@/types/ai';

/**
 * Enhanced AI request validation
 */
interface ValidatedCoachingRequest {
  userData: any;
  tdeeResult: any;
  userPreferences?: UserAIPreferences;
  preferredModel?: AIModelId;
  context?: {
    requestId?: string;
    urgency?: 'low' | 'medium' | 'high';
    retryCount?: number;
    previousModel?: AIModelId;
  };
  options?: {
    enableOptimization?: boolean;
    enableFallback?: boolean;
    maxRetries?: number;
  };
}

/**
 * Rate limiting store (in production, use Redis or similar)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP

/**
 * Simple in-memory cache for coaching responses
 */
const responseCache = new Map<string, { 
  response: any; 
  timestamp: number; 
  expiresAt: number 
}>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestId: string = '';
  
  try {
    // Generate request ID for tracking
    requestId = `coaching_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[Coaching API] ${requestId} - Request started`);

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!checkRateLimit(clientIP)) {
      console.warn(`[Coaching API] ${requestId} - Rate limit exceeded for ${clientIP}`);
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait before making another request.',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    // Validate and parse request
    const validatedRequest = await validateCoachingRequest(request, requestId);
    const { userData, tdeeResult, userPreferences, preferredModel, context, options } = validatedRequest;

    // Check cache first
    const cacheKey = generateCacheKey(userData, tdeeResult, userPreferences, preferredModel);
    const cachedResponse = getCachedResponse(cacheKey);
    
    if (cachedResponse) {
      console.log(`[Coaching API] ${requestId} - Cache hit`);
      return NextResponse.json({
        ...cachedResponse,
        cached: true,
        requestId,
        responseTime: Date.now() - startTime
      });
    }

    // Fallback to rule-based coaching if OpenRouter is not configured
    if (!process.env.OPENROUTER_API_KEY) {
      console.log(`[Coaching API] ${requestId} - Using rule-based fallback (no API key)`);
      const fallbackTips = generateFallbackCoaching(userData, tdeeResult);
      const response = {
        tips: fallbackTips,
        source: 'rule-based',
        cost: 0,
        model: 'fallback',
        optimization: null,
        requestId,
        responseTime: Date.now() - startTime
      };
      
      setCachedResponse(cacheKey, response);
      return NextResponse.json(response);
    }

    try {
      // Enhanced AI preferences with optimization
      const aiPreferences: UserAIPreferences = {
        ...DEFAULT_USER_PREFERENCES,
        ...userPreferences,
        // Aggressive cost optimization for coaching unless user specifies otherwise
        preferFreeModels: userPreferences?.preferFreeModels ?? true,
        maxCostPerRequest: userPreferences?.maxCostPerRequest ?? 0.003, // 0.3 cents max for coaching
        qualityPreference: userPreferences?.qualityPreference ?? 'balanced' as const,
        allowExperimental: userPreferences?.allowExperimental ?? false
      };

      // Smart model selection with optimization
      let selectedModel = preferredModel;
      let optimizationData = null;

      if (options?.enableOptimization !== false) {
        const modelDecision = selectOptimalModel({
          taskType: 'nutrition-coaching',
          userPreferences: aiPreferences,
          complexity: 0.7, // Medium complexity for coaching
          preferredModel,
          context: {
            isRetry: (context?.retryCount || 0) > 0,
            previousModel: context?.previousModel,
            urgency: context?.urgency || 'medium',
            userType: 'returning' // Could be determined from user data
          }
        });

        selectedModel = modelDecision.selectedModel;
        
        // Get cost optimization recommendations
        const costOptimization = getCostOptimizationRecommendations({
          taskType: 'nutrition-coaching',
          userPreferences: aiPreferences,
          complexity: 0.7,
          preferredModel
        });

        optimizationData = {
          selectedModel: modelDecision.selectedModel,
          reason: modelDecision.reason,
          estimatedCost: modelDecision.estimatedCost,
          costSavings: modelDecision.costSavings,
          optimizationScore: modelDecision.optimizationScore,
          confidence: modelDecision.confidence,
          alternatives: modelDecision.alternativesWithScores,
          tradeOffs: modelDecision.tradeOffs,
          costOptimization
        };

        console.log(`[Coaching API] ${requestId} - Selected model: ${selectedModel} (${modelDecision.reason})`);
      }

      // Make AI request with retry logic
      const maxRetries = options?.maxRetries ?? 2;
      let lastError: any = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[Coaching API] ${requestId} - Attempt ${attempt + 1}/${maxRetries + 1} with ${selectedModel}`);
          
          const aiResponse = await getNutritionCoaching(
            userData, 
            tdeeResult, 
            aiPreferences, 
            selectedModel
          );

          // Parse AI response into structured tips
          const tips = parseCoachingResponse(aiResponse.content);

          const response = {
            tips,
            source: 'ai',
            model: aiResponse.modelUsed,
            responseTime: aiResponse.responseTime,
            cost: aiResponse.estimatedCost,
            usedFallback: aiResponse.usedFallback,
            warnings: aiResponse.warnings,
            optimization: optimizationData,
            requestId,
            totalResponseTime: Date.now() - startTime,
            attempt: attempt + 1,
            cached: false
          };

          // Cache successful response
          setCachedResponse(cacheKey, response);

          console.log(`[Coaching API] ${requestId} - Success on attempt ${attempt + 1}`);
          return NextResponse.json(response);

        } catch (aiError: any) {
          lastError = aiError;
          console.error(`[Coaching API] ${requestId} - Attempt ${attempt + 1} failed:`, aiError.message);
          
          // If not last attempt and fallback is enabled, try alternative model
          if (attempt < maxRetries && options?.enableFallback !== false && optimizationData?.alternatives?.length) {
            const nextModel = optimizationData.alternatives[attempt]?.modelId;
            if (nextModel) {
              selectedModel = nextModel;
              console.log(`[Coaching API] ${requestId} - Switching to fallback model: ${selectedModel}`);
              continue;
            }
          }
        }
      }

      // All AI attempts failed, use rule-based fallback
      console.warn(`[Coaching API] ${requestId} - All AI attempts failed, using rule-based fallback`);
      const fallbackTips = generateFallbackCoaching(userData, tdeeResult);
      const response = {
        tips: fallbackTips,
        source: 'rule-based-fallback',
        cost: 0,
        model: 'fallback',
        error: 'AI service temporarily unavailable',
        errorDetails: lastError?.message,
        optimization: optimizationData,
        requestId,
        responseTime: Date.now() - startTime,
        cached: false
      };

      setCachedResponse(cacheKey, response);
      return NextResponse.json(response);

    } catch (processingError) {
      console.error(`[Coaching API] ${requestId} - Processing error:`, processingError);
      
      // Final fallback to rule-based
      const fallbackTips = generateFallbackCoaching(userData, tdeeResult);
      return NextResponse.json({
        tips: fallbackTips,
        source: 'rule-based-fallback',
        cost: 0,
        model: 'fallback',
        error: 'Service temporarily unavailable',
        requestId,
        responseTime: Date.now() - startTime
      });
    }

  } catch (error: any) {
    console.error(`[Coaching API] ${requestId} - Request failed:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to generate coaching advice',
        details: error.message,
        requestId,
        responseTime: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

/**
 * Validate and sanitize coaching request
 */
async function validateCoachingRequest(request: NextRequest, requestId: string): Promise<ValidatedCoachingRequest> {
  let body: any;
  
  try {
    body = await request.json();
  } catch (parseError) {
    throw new Error('Invalid JSON in request body');
  }

  const { userData, tdeeResult, userPreferences, preferredModel, context, options } = body;

  // Validate required fields
  if (!userData || typeof userData !== 'object') {
    throw new Error('Missing or invalid userData');
  }

  if (!tdeeResult || typeof tdeeResult !== 'object' || !tdeeResult.tdee) {
    throw new Error('Missing or invalid tdeeResult');
  }

  // Validate user data structure
  if (typeof userData.age !== 'number' || userData.age < 10 || userData.age > 120) {
    throw new Error('Invalid age in userData');
  }

  if (typeof userData.weight !== 'number' || userData.weight < 30 || userData.weight > 1000) {
    throw new Error('Invalid weight in userData');
  }

  if (!['male', 'female'].includes(userData.gender)) {
    throw new Error('Invalid gender in userData');
  }

  // Validate TDEE result
  if (typeof tdeeResult.tdee !== 'number' || tdeeResult.tdee < 800 || tdeeResult.tdee > 8000) {
    throw new Error('Invalid TDEE value');
  }

  // Validate optional preferred model
  if (preferredModel) {
    const validModels: AIModelId[] = ['gpt-4o-mini', 'qwen3-235b', 'gemini-2.0-flash-exp', 'gpt-oss-120b'];
    if (!validModels.includes(preferredModel)) {
      throw new Error(`Invalid preferredModel: ${preferredModel}`);
    }
  }

  // Validate user preferences
  if (userPreferences) {
    if (userPreferences.maxCostPerRequest && 
        (typeof userPreferences.maxCostPerRequest !== 'number' || 
         userPreferences.maxCostPerRequest < 0 || 
         userPreferences.maxCostPerRequest > 1)) {
      throw new Error('Invalid maxCostPerRequest: must be between 0 and 1');
    }

    if (userPreferences.qualityPreference && 
        !['fast', 'balanced', 'high-quality'].includes(userPreferences.qualityPreference)) {
      throw new Error('Invalid qualityPreference');
    }
  }

  console.log(`[Coaching API] ${requestId} - Request validated successfully`);

  return {
    userData,
    tdeeResult,
    userPreferences,
    preferredModel,
    context,
    options
  };
}

/**
 * Rate limiting check
 */
function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const key = `rate_limit_${clientIP}`;
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    // Reset or create new rate limit window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  // Increment count
  existing.count++;
  rateLimitStore.set(key, existing);
  return true;
}

/**
 * Generate cache key for response caching
 */
function generateCacheKey(
  userData: any, 
  tdeeResult: any, 
  userPreferences?: any, 
  preferredModel?: string
): string {
  const keyData = {
    age: userData.age,
    gender: userData.gender,
    weight: userData.weight,
    goal: userData.goal,
    tdee: tdeeResult.tdee,
    preferFreeModels: userPreferences?.preferFreeModels,
    qualityPreference: userPreferences?.qualityPreference,
    preferredModel
  };
  
  const keyString = JSON.stringify(keyData);
  return Buffer.from(keyString).toString('base64').slice(0, 32);
}

/**
 * Get cached response if available and not expired
 */
function getCachedResponse(cacheKey: string): any | null {
  const cached = responseCache.get(cacheKey);
  if (!cached) return null;
  
  if (Date.now() > cached.expiresAt) {
    responseCache.delete(cacheKey);
    return null;
  }
  
  return cached.response;
}

/**
 * Cache response with TTL
 */
function setCachedResponse(cacheKey: string, response: any): void {
  responseCache.set(cacheKey, {
    response,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_TTL
  });
  
  // Simple cleanup: remove expired entries if cache gets too large
  if (responseCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of responseCache.entries()) {
      if (now > value.expiresAt) {
        responseCache.delete(key);
      }
    }
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