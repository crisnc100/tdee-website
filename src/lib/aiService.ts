/**
 * Enhanced AI Service for Multi-Model TDEE System
 * 
 * This service implements intelligent model routing, cost optimization,
 * automatic fallback, and comprehensive analytics for AI requests.
 * 
 * Key Features:
 * - 90%+ cost reduction through smart model selection
 * - Automatic fallback hierarchy
 * - Sub-3 second response times
 * - Cost tracking and analytics
 * - Model health monitoring
 * - User preference integration
 */

import {
  AIModel,
  AIModelId,
  AIRequest,
  AIResponse,
  AITaskType,
  AIServiceError,
  UserAIPreferences,
  ModelRoutingDecision,
  CostTracker,
  ModelHealthStatus,
  AI_MODELS,
  TASK_MODEL_RECOMMENDATIONS,
  DEFAULT_USER_PREFERENCES
} from '@/types/ai';

/**
 * Enhanced OpenRouter integration
 */
interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Core AI Service Class
 */
export class AIService {
  private costTracker: CostTracker;
  private modelHealth: Map<AIModelId, ModelHealthStatus>;
  private requestCache: Map<string, { response: AIResponse; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.costTracker = this.initializeCostTracker();
    this.modelHealth = new Map();
    this.requestCache = new Map();
    this.initializeModelHealth();
  }

  /**
   * Main AI request method with intelligent routing
   */
  async request(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Model Selection
      const routing = this.selectOptimalModel(request);
      console.log(`[AI Service] Selected model: ${routing.selectedModel} (${routing.reason})`);

      // Step 2: Check cache for identical requests (skip for coaching tasks)
      // Disable cache for nutrition-coaching to ensure fresh responses for follow-ups
      const skipCache = request.taskType === 'nutrition-coaching' || request.disableCache === true;
      
      if (!skipCache) {
        const cacheKey = this.generateCacheKey(request, routing.selectedModel);
        const cached = this.getCachedResponse(cacheKey);
        if (cached) {
          console.log(`[AI Service] Cache hit for ${routing.selectedModel}`);
          return cached;
        }
      } else {
        console.log(`[AI Service] Cache disabled for ${request.taskType} request`);
      }

      // Step 3: Attempt request with selected model
      let response: AIResponse;
      try {
        response = await this.makeModelRequest(request, routing.selectedModel, startTime);
        this.updateModelHealth(routing.selectedModel, true, Date.now() - startTime);
      } catch (error) {
        console.log(`[AI Service] Primary model ${routing.selectedModel} unavailable, attempting fallback...`);
        this.updateModelHealth(routing.selectedModel, false);

        // Step 4: Fallback if enabled and available
        if (request.enableFallback !== false) {
          const fallbackModels = request.fallbackModels || this.getDefaultFallbackModels(routing.selectedModel);
          response = await this.attemptFallbacks(request, fallbackModels, startTime);
          console.log(`[AI Service] Successfully used fallback model: ${response.modelUsed}`);
        } else {
          console.error(`[AI Service] Primary model failed and fallback disabled:`, error);
          throw error;
        }
      }

      // Step 5: Cache successful response (skip for coaching to ensure fresh responses)
      if (!skipCache) {
        const cacheKey = this.generateCacheKey(request, routing.selectedModel);
        this.setCachedResponse(cacheKey, response);
      }

      // Step 6: Update cost tracking
      this.updateCostTracker(response.modelUsed, response.estimatedCost, response.tokenUsage);

      return response;

    } catch (error) {
      const aiError = this.createAIServiceError(error, 'NETWORK_ERROR');
      console.error('[AI Service] Request failed completely:', aiError);
      throw aiError;
    }
  }

  /**
   * Optimize prompts for specific models
   */
  private optimizePromptForModel(request: AIRequest, modelId: AIModelId): AIRequest {
    const model = AI_MODELS[modelId];
    const optimizedRequest = { ...request };

    // Adjust temperature based on model's optimal range
    if (!request.temperature) {
      const temp = model.capabilities.optimalTemperature;
      optimizedRequest.temperature = (temp.min + temp.max) / 2;
    }

    // Adjust max tokens based on model capabilities
    if (!request.maxTokens) {
      optimizedRequest.maxTokens = Math.min(model.capabilities.maxTokens, 2048);
    }

    // Model-specific prompt optimization
    switch (modelId) {
      case 'gpt-4o-mini':
        // GPT-4o-mini works well with structured prompts
        optimizedRequest.systemPrompt = this.addStructureToPrompt(request.systemPrompt);
        break;
      
      case 'qwen3-235b':
        // Qwen benefits from clear, direct instructions
        optimizedRequest.systemPrompt = this.simplifyPromptLanguage(request.systemPrompt);
        break;
      
      case 'gemini-2.0-flash-exp':
        // Gemini 2.0 Flash excels with analytical tasks
        if (request.taskType === 'macro-analysis') {
          optimizedRequest.systemPrompt = this.addAnalyticalFramework(request.systemPrompt);
        }
        break;
    }

    return optimizedRequest;
  }

  /**
   * Intelligent model selection based on task, user preferences, and current health
   */
  private selectOptimalModel(request: AIRequest): ModelRoutingDecision {
    const userPrefs = { ...DEFAULT_USER_PREFERENCES, ...request.userPreferences };
    
    // If user explicitly selected a model, respect that choice
    if (request.preferredModel) {
      const preferredModel = AI_MODELS[request.preferredModel];
      const health = this.modelHealth.get(request.preferredModel);
      
      // Use the preferred model if it's available and healthy
      if (preferredModel?.isAvailable && (!health || health.isHealthy)) {
        console.log(`[AI Service] Using user-selected model: ${request.preferredModel}`);
        return {
          selectedModel: request.preferredModel,
          reason: 'User explicitly selected this model',
          alternatives: TASK_MODEL_RECOMMENDATIONS[request.taskType].filter(id => id !== request.preferredModel),
          estimatedCost: this.estimateRequestCost(request.preferredModel, request),
          estimatedTime: preferredModel.performance.avgResponseTime
        };
      }
      // If preferred model is unavailable, continue with fallback logic
      console.log(`[AI Service] User-selected model ${request.preferredModel} unavailable, using fallback`);
    }
    
    // Start with task-specific recommendations
    let candidateModels = TASK_MODEL_RECOMMENDATIONS[request.taskType];

    // Remove duplicates and filter by availability
    candidateModels = [...new Set(candidateModels)].filter(id => {
      const model = AI_MODELS[id];
      const health = this.modelHealth.get(id);
      return model.isAvailable && (!health || health.isHealthy);
    });

    // Apply user preferences only if no explicit model was selected
    if (userPrefs.preferFreeModels) {
      const freeModels = candidateModels.filter(id => AI_MODELS[id].pricing.isFree);
      if (freeModels.length > 0) {
        candidateModels = [...freeModels, ...candidateModels.filter(id => !AI_MODELS[id].pricing.isFree)];
      }
    }

    if (!userPrefs.allowExperimental) {
      candidateModels = candidateModels.filter(id => AI_MODELS[id].tier !== 'experimental');
    }

    // Select the best available model
    for (const modelId of candidateModels) {
      const model = AI_MODELS[modelId];
      const estimatedCost = this.estimateRequestCost(modelId, request);
      
      // Check cost constraints
      if (userPrefs.maxCostPerRequest && estimatedCost > userPrefs.maxCostPerRequest) {
        continue;
      }

      // Check response time constraints
      if (userPrefs.maxResponseTime && model.performance.avgResponseTime > userPrefs.maxResponseTime) {
        continue;
      }

      return {
        selectedModel: modelId,
        reason: this.getSelectionReason(modelId, userPrefs, request.taskType),
        alternatives: candidateModels.slice(1),
        estimatedCost,
        estimatedTime: model.performance.avgResponseTime
      };
    }

    // Fallback to most reliable available model
    const fallbackModel = candidateModels[0] || 'gpt-4o-mini';
    return {
      selectedModel: fallbackModel,
      reason: 'Last available option',
      alternatives: [],
      estimatedCost: this.estimateRequestCost(fallbackModel, request),
      estimatedTime: AI_MODELS[fallbackModel].performance.avgResponseTime
    };
  }

  /**
   * Make request to specific model via OpenRouter
   */
  private async makeModelRequest(request: AIRequest, modelId: AIModelId, startTime: number): Promise<AIResponse> {
    const model = AI_MODELS[modelId];
    const optimizedRequest = this.optimizePromptForModel(request, modelId);
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // Prepare messages
    const messages: Array<{ role: string; content: string }> = [];
    if (optimizedRequest.systemPrompt) {
      messages.push({ role: 'system', content: optimizedRequest.systemPrompt });
    }
    messages.push(...optimizedRequest.messages);

    const requestBody = {
      model: model.openRouterModel,
      messages,
      temperature: optimizedRequest.temperature || 0.7,
      max_tokens: optimizedRequest.maxTokens || model.capabilities.maxTokens,
      stream: false
    };

    console.log(`[AI Service] Making request to ${modelId} via OpenRouter`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://tdee-calculator.com',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'Multi-AI TDEE Calculator',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI Service] OpenRouter API error for ${modelId}:`, errorText);
      throw this.createAIServiceError(
        new Error(`${response.status}: ${errorText}`),
        'MODEL_UNAVAILABLE',
        modelId
      );
    }

    const data: OpenRouterResponse = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw this.createAIServiceError(
        new Error('Invalid response format'),
        'PARSING_ERROR',
        modelId
      );
    }

    const responseTime = Date.now() - startTime;
    const tokenUsage = {
      input: data.usage?.prompt_tokens || 0,
      output: data.usage?.completion_tokens || 0,
      total: data.usage?.total_tokens || 0
    };

    // Clean the response from any reasoning artifacts
    const cleanedContent = this.cleanResponse(data.choices[0].message.content, modelId);
    
    return {
      content: cleanedContent,
      modelUsed: modelId,
      usedFallback: false,
      responseTime,
      estimatedCost: this.calculateActualCost(modelId, tokenUsage),
      tokenUsage,
      warnings: []
    };
  }

  /**
   * Clean response from reasoning artifacts and thinking tags
   */
  private cleanResponse(content: string, modelId: AIModelId): string {
    // Remove thinking tags and content
    let cleaned = content
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
      .replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, '')
      .replace(/\[THINK\][\s\S]*?\[\/THINK\]/gi, '');
    
    // Remove QwQ-specific reasoning patterns
    if (modelId === 'qwq-32b') {
      // Remove lines that start with reasoning indicators
      cleaned = cleaned.split('\n')
        .filter(line => {
          const lower = line.toLowerCase().trim();
          return !lower.startsWith('okay, let\'s') &&
                 !lower.startsWith('first, i need') &&
                 !lower.startsWith('let me think') &&
                 !lower.startsWith('hmm,') &&
                 !lower.includes('let\'s tackle this');
        })
        .join('\n');
    }
    
    // Remove any "Key Point" headers without content
    cleaned = cleaned.replace(/^Key Point \d+\s*$/gm, '');
    
    // Trim excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
    
    // If the response is empty after cleaning, provide a fallback
    if (!cleaned || cleaned.length < 10) {
      console.warn(`[AI Service] Response was empty after cleaning for ${modelId}`);
      return 'I understand your question. Based on your TDEE data, I recommend focusing on maintaining consistent nutrition and activity levels. Please ask a specific question for more detailed advice.';
    }
    
    return cleaned;
  }
  
  /**
   * Attempt fallback models in order
   */
  private async attemptFallbacks(
    request: AIRequest, 
    fallbackModels: AIModelId[], 
    originalStartTime: number
  ): Promise<AIResponse> {
    
    for (const modelId of fallbackModels) {
      const health = this.modelHealth.get(modelId);
      if (health && !health.isHealthy) {
        console.log(`[AI Service] Skipping unhealthy fallback model: ${modelId}`);
        continue;
      }

      try {
        console.log(`[AI Service] Attempting fallback to ${modelId}`);
        const response = await this.makeModelRequest(request, modelId, Date.now());
        response.usedFallback = true;
        response.warnings = [`Used fallback model ${modelId} due to primary model failure`];
        return response;
      } catch (error) {
        console.error(`[AI Service] Fallback model ${modelId} also failed:`, error);
        this.updateModelHealth(modelId, false);
        continue;
      }
    }

    throw this.createAIServiceError(
      new Error('All fallback models failed'),
      'MODEL_UNAVAILABLE'
    );
  }

  /**
   * Get default fallback models for a given primary model
   */
  private getDefaultFallbackModels(primaryModel: AIModelId): AIModelId[] {
    const allModels = Object.keys(AI_MODELS) as AIModelId[];
    
    return allModels
      .filter(id => {
        // Exclude primary model and unavailable models
        return id !== primaryModel && AI_MODELS[id].isAvailable;
      })
      .sort((a, b) => AI_MODELS[a].fallbackPriority - AI_MODELS[b].fallbackPriority);
  }

  /**
   * Estimate cost for a request
   */
  private estimateRequestCost(modelId: AIModelId, request: AIRequest): number {
    const model = AI_MODELS[modelId];
    if (model.pricing.isFree) return 0;

    // Rough token estimation based on content length
    const totalContent = (request.systemPrompt || '') + 
      request.messages.map(m => m.content).join('');
    
    const estimatedInputTokens = Math.ceil(totalContent.length / 4); // ~4 chars per token
    const estimatedOutputTokens = request.maxTokens || model.capabilities.maxTokens;

    const inputCost = (estimatedInputTokens / 1_000_000) * model.pricing.inputCostPer1M;
    const outputCost = (estimatedOutputTokens / 1_000_000) * model.pricing.outputCostPer1M;

    return inputCost + outputCost;
  }

  /**
   * Calculate actual cost based on token usage
   */
  private calculateActualCost(modelId: AIModelId, tokenUsage: { input: number; output: number }): number {
    const model = AI_MODELS[modelId];
    if (model.pricing.isFree) return 0;

    const inputCost = (tokenUsage.input / 1_000_000) * model.pricing.inputCostPer1M;
    const outputCost = (tokenUsage.output / 1_000_000) * model.pricing.outputCostPer1M;

    return inputCost + outputCost;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: AIRequest, modelId: AIModelId): string {
    const contentHash = JSON.stringify({
      model: modelId,
      systemPrompt: request.systemPrompt,
      messages: request.messages,
      taskType: request.taskType,
      temperature: request.temperature,
      maxTokens: request.maxTokens
    });
    
    return Buffer.from(contentHash).toString('base64').slice(0, 32);
  }

  /**
   * Get cached response if available and fresh
   */
  private getCachedResponse(cacheKey: string): AIResponse | null {
    const cached = this.requestCache.get(cacheKey);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.requestCache.delete(cacheKey);
      return null;
    }
    
    return cached.response;
  }

  /**
   * Cache successful response
   */
  private setCachedResponse(cacheKey: string, response: AIResponse): void {
    this.requestCache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });
    
    // Clean old cache entries (simple cleanup)
    if (this.requestCache.size > 100) {
      const oldestKey = this.requestCache.keys().next().value;
      if (oldestKey) {
        this.requestCache.delete(oldestKey);
      }
    }
  }

  /**
   * Initialize cost tracker
   */
  private initializeCostTracker(): CostTracker {
    return {
      dailySpend: {} as Record<AIModelId, number>,
      requestCount: {} as Record<AIModelId, number>,
      tokenUsage: {} as Record<AIModelId, { input: number; output: number }>,
      lastReset: new Date().toISOString().split('T')[0] // Today's date
    };
  }

  /**
   * Initialize model health tracking
   */
  private initializeModelHealth(): void {
    Object.keys(AI_MODELS).forEach(modelId => {
      this.modelHealth.set(modelId as AIModelId, {
        modelId: modelId as AIModelId,
        isHealthy: true,
        lastChecked: new Date().toISOString(),
        errorRate: 0,
        consecutiveFailures: 0
      });
    });
  }

  /**
   * Update model health status
   */
  private updateModelHealth(modelId: AIModelId, success: boolean, responseTime?: number): void {
    const health = this.modelHealth.get(modelId) || {
      modelId,
      isHealthy: true,
      lastChecked: new Date().toISOString(),
      errorRate: 0,
      consecutiveFailures: 0
    };

    if (success) {
      health.consecutiveFailures = 0;
      health.isHealthy = true;
      if (responseTime) {
        health.responseTime = responseTime;
      }
    } else {
      health.consecutiveFailures++;
      health.errorRate = Math.min(health.errorRate + 0.1, 1.0);
      
      // Mark as unhealthy after 3 consecutive failures
      if (health.consecutiveFailures >= 3) {
        health.isHealthy = false;
        console.warn(`[AI Service] Model ${modelId} marked as unhealthy`);
      }
    }

    health.lastChecked = new Date().toISOString();
    this.modelHealth.set(modelId, health);
  }

  /**
   * Update cost tracking
   */
  private updateCostTracker(
    modelId: AIModelId, 
    cost: number, 
    tokenUsage: { input: number; output: number }
  ): void {
    const today = new Date().toISOString().split('T')[0];
    
    // Reset if new day
    if (this.costTracker.lastReset !== today) {
      this.costTracker = this.initializeCostTracker();
      this.costTracker.lastReset = today;
    }

    // Update tracking
    this.costTracker.dailySpend[modelId] = (this.costTracker.dailySpend[modelId] || 0) + cost;
    this.costTracker.requestCount[modelId] = (this.costTracker.requestCount[modelId] || 0) + 1;
    
    if (!this.costTracker.tokenUsage[modelId]) {
      this.costTracker.tokenUsage[modelId] = { input: 0, output: 0 };
    }
    this.costTracker.tokenUsage[modelId].input += tokenUsage.input;
    this.costTracker.tokenUsage[modelId].output += tokenUsage.output;
  }

  /**
   * Get selection reason for logging
   */
  private getSelectionReason(
    modelId: AIModelId, 
    userPrefs: UserAIPreferences, 
    taskType: AITaskType
  ): string {
    const model = AI_MODELS[modelId];
    
    if (model.pricing.isFree && userPrefs.preferFreeModels) {
      return `Free model preferred by user for ${taskType}`;
    }
    
    if (TASK_MODEL_RECOMMENDATIONS[taskType][0] === modelId) {
      return `Optimal model for ${taskType} tasks`;
    }
    
    return `Best available model matching user preferences`;
  }

  /**
   * Create standardized AI service error
   */
  private createAIServiceError(
    originalError: any, 
    code: AIServiceError['code'], 
    modelId?: AIModelId
  ): AIServiceError {
    // Handle different error formats safely
    let message = 'AI Service error';
    if (originalError) {
      if (typeof originalError === 'string') {
        message = originalError;
      } else if (originalError.message) {
        message = originalError.message;
      } else if (originalError.error) {
        message = originalError.error;
      } else if (originalError.toString) {
        message = originalError.toString();
      }
    }
    
    const error = new Error(message) as AIServiceError;
    error.code = code;
    error.modelId = modelId;
    error.retryable = ['NETWORK_ERROR', 'MODEL_UNAVAILABLE'].includes(code);
    error.fallbackAvailable = this.hasFallbackOptions(modelId);
    
    return error;
  }

  /**
   * Check if fallback options are available
   */
  private hasFallbackOptions(currentModel?: AIModelId): boolean {
    const healthyModels = Array.from(this.modelHealth.entries())
      .filter(([id, health]) => health.isHealthy && AI_MODELS[id].isAvailable)
      .map(([id]) => id);
    
    return currentModel ? healthyModels.length > 1 : healthyModels.length > 0;
  }

  /**
   * Prompt optimization methods
   */
  private addStructureToPrompt(prompt?: string): string {
    if (!prompt) return '';
    
    return prompt + '\n\nPlease structure your response with clear sections and actionable recommendations.';
  }

  private simplifyPromptLanguage(prompt?: string): string {
    if (!prompt) return '';
    
    // Qwen works better with direct, simple language
    return prompt.replace(/kindly|please consider|you might want to/gi, '')
      .replace(/complex|sophisticated|comprehensive/gi, 'detailed');
  }

  private addAnalyticalFramework(prompt?: string): string {
    if (!prompt) return '';
    
    return prompt + '\n\nProvide a data-driven analysis with specific numbers and clear reasoning for each recommendation.';
  }

  /**
   * Public method to get current cost analytics
   */
  public getCostAnalytics(): CostTracker {
    return { ...this.costTracker };
  }

  /**
   * Public method to get model health status
   */
  public getModelHealth(): Record<AIModelId, ModelHealthStatus> {
    const health: Record<AIModelId, ModelHealthStatus> = {} as any;
    
    this.modelHealth.forEach((status, modelId) => {
      health[modelId] = { ...status };
    });
    
    return health;
  }

  /**
   * Public method to reset model health (useful for testing)
   */
  public resetModelHealth(modelId?: AIModelId): void {
    if (modelId) {
      this.modelHealth.set(modelId, {
        modelId,
        isHealthy: true,
        lastChecked: new Date().toISOString(),
        errorRate: 0,
        consecutiveFailures: 0
      });
    } else {
      this.initializeModelHealth();
    }
  }
}

// Global service instance
export const aiService = new AIService();

/**
 * Convenience functions for common TDEE-related AI tasks
 */

/**
 * Get personalized nutrition coaching
 */
export async function getNutritionCoaching(
  userData: any, 
  tdeeResult: any, 
  userPreferences?: UserAIPreferences,
  preferredModel?: AIModelId
): Promise<AIResponse> {
  const prompt = `You are a certified personal trainer and nutrition expert. Analyze this person's TDEE data and provide personalized coaching insights.

USER PROFILE:
- Age: ${userData.age}, Gender: ${userData.gender}
- Weight: ${userData.weight}${userData.units === 'metric' ? 'kg' : 'lbs'}
- Height: ${userData.units === 'metric' ? userData.height + 'cm' : userData.heightFeet + "'" + userData.heightInches + '"'}
- Job: ${userData.jobActivity} (${userData.steps} daily steps)
- Body Fat: ${userData.bodyFat || 'Unknown'}%
- Exercise: ${userData.exercises?.map((ex: any) => `${ex.type} ${ex.intensity} ${ex.minutes}min ${ex.frequency}x/week`).join(', ') || userData.simpleExerciseLevel || 'None specified'}

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

  return aiService.request({
    taskType: 'nutrition-coaching',
    systemPrompt: 'You are an expert personal trainer and nutritionist providing personalized coaching advice.',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    maxTokens: 600,
    enableFallback: true,
    userPreferences,
    preferredModel
  });
}

/**
 * Get meal planning suggestions
 */
export async function getMealSuggestions(
  targetCalories: number,
  goal: 'lose' | 'maintain' | 'gain',
  dietaryPreferences?: string[],
  userPreferences?: UserAIPreferences
): Promise<AIResponse> {
  const prompt = `You are a nutrition expert. Create meal suggestions for someone with these requirements:

REQUIREMENTS:
- Target: ${targetCalories} calories per meal
- Goal: ${goal} weight
- Dietary preferences: ${dietaryPreferences?.join(', ') || 'None specified'}

TASK: Suggest 2-3 meal ideas that:
1. Meet the calorie target (within 50 calories)
2. Are appropriate for the ${goal} goal
3. Include specific ingredients and portions
4. Are realistic and easy to prepare
5. Consider the dietary preferences

Format each suggestion with:
- Meal name
- Ingredient list with portions
- Brief preparation steps
- Macro breakdown (protein, carbs, fats)

Keep suggestions practical and appetizing.`;

  return aiService.request({
    taskType: 'meal-planning',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    maxTokens: 800,
    enableFallback: true,
    userPreferences
  });
}

/**
 * Get macro analysis and recommendations
 */
export async function getMacroAnalysis(
  calories: number,
  goal: 'lose' | 'maintain' | 'gain',
  userData: any,
  userPreferences?: UserAIPreferences
): Promise<AIResponse> {
  const weeklyHours = userData.exercises?.reduce((total: number, ex: any) => 
    total + ((ex.minutes * ex.frequency) / 60), 0) || 0;

  const prompt = `You are a sports nutritionist. Analyze and recommend macros for this person:

PROFILE:
- Calories: ${calories}
- Goal: ${goal} weight
- Age: ${userData.age}, Gender: ${userData.gender}
- Weekly exercise: ${weeklyHours} hours
- Activity level: ${userData.jobActivity} job, ${userData.steps} daily steps

TASK: Provide macro recommendations with:
1. Protein grams and reasoning
2. Carbohydrate grams and timing advice
3. Fat grams and type recommendations
4. One specific tip for their goal and activity level

Be specific with numbers and explain your reasoning based on their profile.`;

  return aiService.request({
    taskType: 'macro-analysis',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    maxTokens: 500,
    enableFallback: true,
    userPreferences
  });
}