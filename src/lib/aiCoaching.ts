/**
 * Advanced AI Coaching Service with Reality Check Mode
 * 
 * This service provides sophisticated coaching modes with model-specific
 * prompt engineering, context-aware responses, and personalized feedback
 * tailored to each AI model's strengths.
 * 
 * Features:
 * - Reality Check mode for direct, honest feedback
 * - Model-specific prompt optimization 
 * - Context-aware coaching style adaptation
 * - Progressive coaching difficulty
 * - Safety guardrails for health advice
 */

import { AIModelId, AIRequest, AIResponse, UserAIPreferences } from '@/types/ai';
import { aiService } from '@/lib/aiService';

/**
 * Coaching modes with distinct approaches
 */
export type CoachingMode = 
  | 'supportive'      // Encouraging, motivational approach
  | 'reality-check'   // Direct, honest, myth-busting approach  
  | 'educational'     // Detailed explanations with scientific backing
  | 'analytical';     // Data-driven, structured analysis

/**
 * Coaching context for maintaining conversation flow
 */
export interface CoachingContext {
  userId?: string;
  previousInteractions?: number;
  userGoals?: string[];
  successRate?: number;
  lastCoachingDate?: string;
  preferredTone?: 'gentle' | 'direct' | 'scientific';
  strugglingAreas?: string[];
}

/**
 * Coaching request parameters
 */
export interface CoachingRequest {
  mode: CoachingMode;
  userData: any;
  tdeeResult: any;
  context?: CoachingContext;
  specificQuestion?: string;
  preferredModel?: AIModelId;
  userPreferences?: UserAIPreferences;
}

/**
 * Enhanced coaching response with metadata
 */
export interface CoachingResponse extends AIResponse {
  mode: CoachingMode;
  coachingType: 'tips' | 'analysis' | 'reality-check' | 'encouragement';
  confidenceLevel: number;
  followUpSuggestions: string[];
  safetyWarnings: string[];
  modelSpecificInsights?: string;
}

/**
 * Personality-based coaching styles - these define HOW the AI communicates
 * Independent of which model is used
 */
const COACHING_PERSONALITIES = {
  supportive: `You are a compassionate fitness coach who combines empathy with expertise. Your goal is to motivate and guide users toward sustainable health improvements.

COACHING STYLE:
- Use encouraging language that builds confidence
- Acknowledge challenges while focusing on solutions
- Celebrate small wins and progress
- Provide gentle corrections when needed
- Focus on sustainable, long-term success`,

  'reality-check': `You are a no-nonsense fitness expert who tells the truth even when it's uncomfortable. Your mission is to cut through fitness myths and deliver evidence-based reality checks.

COACHING STYLE:
- Be direct but not harsh - truth with tact
- Challenge unrealistic expectations immediately
- Call out excuses and shortcuts
- Focus on what actually works, not what sounds good
- Emphasize consistency over perfection`,

  educational: `You are a science-based fitness educator who excels at explaining complex concepts clearly. Your approach combines academic rigor with practical application.

COACHING STYLE:
- Explain the 'why' behind every recommendation
- Use analogies to make concepts accessible
- Reference relevant studies when appropriate
- Build understanding progressively
- Connect theory to practical implementation`,

  analytical: `You are a data-driven fitness expert who excels at analyzing numbers and providing quantified insights.

COACHING STYLE:
- Lead with specific numbers and calculations
- Provide quantified comparisons and benchmarks
- Focus on measurable outcomes and tracking
- Use data to support all recommendations
- Optimize for efficiency and results`
};

/**
 * Model-specific strengths and optimizations
 * These modify HOW WELL each model performs certain tasks
 */
const MODEL_STRENGTHS = {
  'gpt-4o-mini': {
    name: 'Balanced Assistant',
    userFriendlyName: '🎯 Balanced & Reliable',
    description: 'Well-rounded AI that excels at clear communication and practical advice',
    strengths: [
      'Clear, structured responses',
      'Great at motivation and encouragement',
      'Reliable for general fitness guidance',
      'Good balance of detail and simplicity'
    ],
    bestFor: ['beginners', 'general-guidance', 'motivation'],
    personalityBoost: {
      supportive: 'Adds extra warmth and encouragement to responses',
      'reality-check': 'Maintains directness while being constructive',
      educational: 'Explains concepts in very accessible ways',
      analytical: 'Provides clear, organized data analysis'
    }
  },

  'gpt-oss-120b': {
    name: 'Open Knowledge Base',
    userFriendlyName: '📚 Comprehensive & Free',
    description: 'Large open-source model with extensive fitness knowledge',
    strengths: [
      'Broad knowledge base',
      'Good at comprehensive explanations',
      'Free to use with no limits',
      'Consistent and reliable'
    ],
    bestFor: ['detailed-explanations', 'cost-conscious-users', 'comprehensive-advice'],
    personalityBoost: {
      supportive: 'Provides thorough encouragement with context',
      'reality-check': 'Delivers comprehensive reality assessments',
      educational: 'Offers detailed educational content',
      analytical: 'Gives thorough data breakdowns'
    }
  },

  'qwen3-235b': {
    name: 'Advanced Reasoning',
    userFriendlyName: '🧠 Deep Thinker',
    description: 'Powerful model that excels at complex reasoning and problem-solving',
    strengths: [
      'Exceptional at complex problem analysis',
      'Great for troubleshooting plateaus',
      'Considers multiple factors simultaneously',
      'Excellent logical reasoning'
    ],
    bestFor: ['complex-problems', 'plateau-breaking', 'advanced-users'],
    personalityBoost: {
      supportive: 'Uses reasoning to validate and encourage progress',
      'reality-check': 'Provides logical, evidence-based reality checks',
      educational: 'Excels at teaching through logical progression',
      analytical: 'Performs sophisticated multi-factor analysis'
    }
  },

  'gemini-2.0-flash-exp': {
    name: 'Data Specialist',
    userFriendlyName: '📊 Numbers Expert',
    description: 'Google\'s model optimized for data analysis and quantitative insights',
    strengths: [
      'Exceptional with numbers and calculations',
      'Great at progress tracking analysis',
      'Excellent data visualization descriptions',
      'Strong predictive modeling'
    ],
    bestFor: ['data-driven-users', 'progress-tracking', 'optimization'],
    personalityBoost: {
      supportive: 'Uses data to show encouraging progress trends',
      'reality-check': 'Lets numbers reveal the truth objectively',
      educational: 'Teaches through data examples and patterns',
      analytical: 'Provides advanced statistical analysis and projections'
    }
  }
} as const;

/**
 * Export coaching personalities for UI use
 */
export const PERSONALITY_INFO = {
  supportive: {
    name: '💖 Supportive Coach',
    shortName: 'Supportive',
    description: 'Encouraging and motivational, focuses on building confidence',
    tone: 'Warm, understanding, and positive',
    bestFor: 'Beginners or those needing motivation'
  },
  'reality-check': {
    name: '🎯 Reality Check',
    shortName: 'No BS',
    description: 'Direct and honest feedback, no sugar-coating',
    tone: 'Straightforward, factual, myth-busting',
    bestFor: 'Experienced users who want the truth'
  },
  educational: {
    name: '🎓 Educational Expert',
    shortName: 'Teacher',
    description: 'Explains the science behind recommendations',
    tone: 'Informative, thorough, teaching-focused',
    bestFor: 'Those who want to understand the "why"'
  },
  analytical: {
    name: '📊 Data Analyst',
    shortName: 'Analyst',
    description: 'Numbers-driven insights and optimization',
    tone: 'Precise, quantitative, efficiency-focused',
    bestFor: 'Data-driven users who love metrics'
  }
};

/**
 * Export model strengths for UI use
 */
export { MODEL_STRENGTHS as MODEL_INFO };

/**
 * Get user-friendly model information
 */
export function getModelInfo(modelId: AIModelId) {
  return MODEL_STRENGTHS[modelId] || MODEL_STRENGTHS['gpt-4o-mini'];
}

/**
 * Get personality description
 */
export function getPersonalityInfo(mode: CoachingMode) {
  return PERSONALITY_INFO[mode];
}

/**
 * Advanced AI Coaching Service
 */
export class AdvancedAICoachingService {
  private static instance: AdvancedAICoachingService;
  private coachingHistory: Map<string, CoachingContext> = new Map();

  public static getInstance(): AdvancedAICoachingService {
    if (!AdvancedAICoachingService.instance) {
      AdvancedAICoachingService.instance = new AdvancedAICoachingService();
    }
    return AdvancedAICoachingService.instance;
  }

  /**
   * Get coaching advice with mode-specific and model-optimized prompts
   */
  async getCoaching(request: CoachingRequest): Promise<CoachingResponse> {
    const { mode, userData, tdeeResult, context, preferredModel, userPreferences } = request;

    console.log('[AICoaching] Starting coaching request:', {
      mode,
      hasSpecificQuestion: !!request.specificQuestion,
      specificQuestion: request.specificQuestion?.substring(0, 100),
      preferredModel
    });

    // Select optimal model for the coaching mode if none specified
    const selectedModel = preferredModel || this.selectOptimalModelForMode(mode);

    // Build model-specific prompt
    const prompt = this.buildModelSpecificPrompt(
      selectedModel, 
      mode, 
      userData, 
      tdeeResult, 
      context,
      request.specificQuestion
    );

    console.log('[AICoaching] Built prompt:', prompt.substring(0, 200));

    // Execute AI request with optimized parameters
    const aiRequest: AIRequest = {
      taskType: 'nutrition-coaching',
      systemPrompt: this.getSystemPromptForMode(selectedModel, mode),
      messages: [{ role: 'user', content: prompt }],
      temperature: this.getOptimalTemperature(selectedModel, mode),
      maxTokens: this.getOptimalMaxTokens(selectedModel, mode),
      preferredModel: selectedModel,
      userPreferences,
      enableFallback: true,
      disableCache: true // Always disable cache for coaching to ensure fresh responses
    };

    try {
      const response = await aiService.request(aiRequest);
      
      // Process response and add coaching-specific metadata
      return this.enhanceCoachingResponse(response, request);
    } catch (error) {
      console.error('[AdvancedAICoaching] Request failed:', error);
      
      // Check if this is a critical error that should not use fallback
      if (error instanceof Error && error.message.includes('estimateCost')) {
        throw error; // Re-throw to properly handle in API route
      }
      
      // Return fallback coaching response only for network/temporary issues
      return this.getFallbackCoaching(request);
    }
  }

  /**
   * Select optimal model for specific coaching mode
   */
  private selectOptimalModelForMode(mode: CoachingMode): AIModelId {
    switch (mode) {
      case 'reality-check':
        // GPT-4o-mini excels at balanced directness
        return 'gpt-4o-mini';
      case 'educational':
        // Qwen2.5 is great for structured explanations
        return 'qwen3-235b';
      case 'analytical':
        // Gemini 2.0 Flash excels at data analysis
        return 'gemini-2.0-flash-exp';
      case 'supportive':
      default:
        // GPT-4o-mini for balanced supportive coaching
        return 'gpt-4o-mini';
    }
  }

  /**
   * Build model-specific prompt optimized for the selected AI
   */
  private buildModelSpecificPrompt(
    modelId: AIModelId,
    mode: CoachingMode,
    userData: any,
    tdeeResult: any,
    context?: CoachingContext,
    specificQuestion?: string
  ): string {
    // Get personality-based coaching style
    const personalityPrompt = COACHING_PERSONALITIES[mode];
    
    // Get model-specific strength boost
    const modelStrength = MODEL_STRENGTHS[modelId];
    const strengthBoost = modelStrength?.personalityBoost?.[mode] || '';

    // Build user profile section
    const userProfile = this.buildUserProfile(userData, tdeeResult);
    
    // Build context section if available
    const contextSection = context ? this.buildContextSection(context) : '';
    
    // Build specific question section with timestamp for uniqueness
    const questionSection = specificQuestion ? 
      `\n\nSPECIFIC QUESTION: ${specificQuestion}\n[Request Time: ${new Date().toISOString()}]` : '';

    // Build mode-specific task instructions (consider specific question)
    const taskInstructions = this.buildTaskInstructionsWithQuestion(mode, modelId, specificQuestion);

    // Build safety guidelines
    const safetyGuidelines = this.buildSafetyGuidelines();

    // Add debug logging
    console.log('[AICoaching] Question section:', questionSection);

    return `${personalityPrompt}

MODEL-SPECIFIC FOCUS: ${strengthBoost}

${userProfile}${contextSection}${questionSection}

${taskInstructions}

${safetyGuidelines}

Provide your response in the coaching style specified above.`;
  }

  /**
   * Build comprehensive user profile for AI context
   */
  private buildUserProfile(userData: any, tdeeResult: any): string {
    const exercises = userData.exercises?.map((ex: any) => 
      `${ex.type} ${ex.intensity} ${ex.minutes}min ${ex.frequency}x/week`
    ).join(', ') || userData.simpleExerciseLevel || 'None specified';

    const weightUnit = userData.units === 'metric' ? 'kg' : 'lbs';
    const heightDisplay = userData.units === 'metric' 
      ? `${userData.height}cm`
      : `${userData.heightFeet}'${userData.heightInches}"`;

    return `USER PROFILE:
- Age: ${userData.age}, Gender: ${userData.gender}
- Weight: ${userData.weight}${weightUnit}, Height: ${heightDisplay}
- Job Activity: ${userData.jobActivity} (${userData.steps} daily steps)
- Body Fat: ${userData.bodyFat || 'Unknown'}%
- Exercise: ${exercises}

CALCULATED RESULTS:
- TDEE: ${tdeeResult.tdee} calories/day
- BMR: ${tdeeResult.bmr} calories/day
- Activity Breakdown:
  * BMR: ${tdeeResult.components?.bmr || tdeeResult.bmr} cal
  * Job Activity: ${tdeeResult.components?.jobActivity || 'N/A'} cal  
  * Daily Steps: ${tdeeResult.components?.neat || 'N/A'} cal
  * Exercise: ${tdeeResult.components?.exercise || 'N/A'} cal
  * Recovery: ${tdeeResult.components?.muscleRecovery || 0} cal`;
  }

  /**
   * Build context section from previous interactions
   */
  private buildContextSection(context: CoachingContext): string {
    const strugglingAreas = Array.isArray(context.strugglingAreas) 
      ? context.strugglingAreas.join(', ') 
      : 'None identified';
    const userGoals = Array.isArray(context.userGoals) 
      ? context.userGoals.join(', ') 
      : 'General fitness improvement';
    const successRate = typeof context.successRate === 'number' 
      ? (context.successRate * 100).toFixed(0) 
      : '0';
    const previousInteractions = typeof context.previousInteractions === 'number' 
      ? context.previousInteractions.toString() 
      : 'None';
    
    return `\n\nCOACHING CONTEXT:
- Previous interactions: ${previousInteractions}
- Success rate with advice: ${successRate}%
- Struggling areas: ${strugglingAreas}
- Preferred feedback tone: ${context.preferredTone || 'Balanced'}
- User goals: ${userGoals}`;
  }

  /**
   * Build mode-specific task instructions
   */
  private buildTaskInstructions(mode: CoachingMode, modelId: AIModelId): string {
    const baseInstructions = {
      supportive: `TASK: Provide 3-4 encouraging, actionable coaching tips that:
1. Motivate the user while being realistic
2. Address their specific activity level and lifestyle
3. Include at least one protein recommendation (0.75-1g/lb bodyweight)
4. Offer one lifestyle optimization tip
5. End with an encouraging insight about their potential`,

      'reality-check': `TASK: Provide 3-4 direct, honest reality checks that:
1. Identify any unrealistic expectations in their approach
2. Debunk common myths relevant to their situation  
3. Provide evidence-based alternatives to misconceptions
4. Give them realistic timelines for their goals
5. End with tough-love motivation about what actually works`,

      educational: `TASK: Provide 3-4 educational insights that:
1. Explain the science behind their TDEE calculation
2. Teach them about optimal protein needs (0.75g/lb for muscle synthesis)
3. Explain how their activity level affects their metabolism
4. Provide actionable knowledge they can apply immediately
5. Include one advanced tip for optimization`,

      analytical: `TASK: Provide 3-4 data-driven analyses that:
1. Break down their calorie allocation by component
2. Analyze their activity efficiency and optimization potential
3. Calculate specific macro targets with reasoning
4. Identify the highest-impact changes based on their numbers
5. Provide quantified predictions for different scenarios`
    };

    return baseInstructions[mode];
  }
  
  private buildTaskInstructionsWithQuestion(mode: CoachingMode, modelId: AIModelId, specificQuestion?: string): string {
    // If there's a specific question, prioritize answering it directly
    if (specificQuestion && specificQuestion.toLowerCase().includes('user question:')) {
      const modeContext = {
        supportive: 'Provide a helpful, encouraging response',
        'reality-check': 'Give an honest, evidence-based response', 
        educational: 'Provide an educational, detailed response',
        analytical: 'Give a data-driven, analytical response'
      };
      
      return `
Provide a helpful, specific response to this question based on their TDEE data and fitness goals.`;
    }
    
    // Otherwise use the default task instructions
    return this.buildTaskInstructions(mode, modelId);
  }

  /**
   * Build safety guidelines for health advice
   */
  private buildSafetyGuidelines(): string {
    return `SAFETY GUIDELINES:
- Never recommend extreme calorie restrictions (<1200 for women, <1500 for men)
- Always suggest consulting healthcare providers for medical conditions
- Don't diagnose or treat medical conditions
- Emphasize gradual, sustainable changes over quick fixes
- Include disclaimers for extreme body fat percentages
- Avoid specific supplement recommendations without proper context`;
  }

  /**
   * Get system prompt optimized for model and mode
   */
  private getSystemPromptForMode(modelId: AIModelId, mode: CoachingMode): string {
    const basePrompts = {
      supportive: 'You are an expert fitness coach providing encouraging, evidence-based advice.',
      'reality-check': 'You are a direct fitness expert who provides honest, myth-busting reality checks.',
      educational: 'You are a fitness educator who explains concepts with scientific backing.',
      analytical: 'You are a data-driven fitness analyst who uses numbers to provide insights.'
    };

    return basePrompts[mode];
  }

  /**
   * Get optimal temperature for model and mode combination
   */
  private getOptimalTemperature(modelId: AIModelId, mode: CoachingMode): number {
    // Reality check and analytical modes need lower temperature for consistency
    // Supportive and educational can be slightly more creative
    const modeTemperatures = {
      'reality-check': 0.6,
      analytical: 0.5,
      educational: 0.7,
      supportive: 0.8
    };

    return modeTemperatures[mode];
  }

  /**
   * Get optimal max tokens for model and mode
   */
  private getOptimalMaxTokens(modelId: AIModelId, mode: CoachingMode): number {
    // Increased token limits to prevent cut-off responses
    // All modes need sufficient tokens for complete answers
    const modeTokens = {
      educational: 1500,  // Detailed explanations
      analytical: 1400,   // Data analysis and calculations
      supportive: 1200,   // Encouraging comprehensive advice
      'reality-check': 1200  // Thorough reality checks with alternatives
    };

    return modeTokens[mode];
  }

  /**
   * Enhance AI response with coaching-specific metadata
   */
  private enhanceCoachingResponse(
    response: AIResponse, 
    request: CoachingRequest
  ): CoachingResponse {
    // Parse response content to extract tips and analyze structure
    const tips = this.extractTipsFromResponse(response.content);
    const safetyWarnings = this.identifySafetyWarnings(response.content);
    const followUpSuggestions = this.generateFollowUpSuggestions(request.mode, tips);

    return {
      ...response,
      mode: request.mode,
      coachingType: this.classifyCoachingType(response.content, request.mode),
      confidenceLevel: this.calculateConfidenceLevel(response),
      followUpSuggestions,
      safetyWarnings,
      modelSpecificInsights: this.extractModelSpecificInsights(response.modelUsed, response.content)
    };
  }

  /**
   * Extract individual tips from AI response
   */
  private extractTipsFromResponse(content: string): string[] {
    // Split content by numbered points or clear separators
    const lines = content.split('\n').filter(line => line.trim());
    const tips: string[] = [];
    
    for (const line of lines) {
      // Look for numbered items, bullet points, or clear tip indicators
      if (line.match(/^\d+\./) || line.match(/^[•\-\*]/) || line.includes('TIP:')) {
        tips.push(line.trim());
      }
    }

    return tips.length > 0 ? tips : [content]; // Fallback to full content
  }

  /**
   * Identify any safety warnings in the response
   */
  private identifySafetyWarnings(content: string): string[] {
    const warnings: string[] = [];
    const safetyKeywords = [
      'medical condition', 'consult doctor', 'healthcare provider',
      'extreme', 'dangerous', 'injury', 'pain'
    ];

    for (const keyword of safetyKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        warnings.push(`Response mentions ${keyword} - user should exercise caution`);
      }
    }

    return warnings;
  }

  /**
   * Generate relevant follow-up suggestions
   */
  private generateFollowUpSuggestions(mode: CoachingMode, tips: string[]): string[] {
    const suggestions = {
      supportive: [
        'Ask about specific obstacles you\'re facing',
        'Request a detailed weekly meal plan',
        'Get personalized exercise modifications',
        'Discuss motivation strategies'
      ],
      'reality-check': [
        'Challenge any remaining misconceptions',
        'Get honest feedback on your current approach',
        'Ask for evidence behind fitness claims you\'ve heard',
        'Request a realistic timeline assessment'
      ],
      educational: [
        'Learn more about metabolic adaptation',
        'Understand macro timing and its effects',
        'Explore advanced nutrition strategies',
        'Get detailed exercise physiology explanations'
      ],
      analytical: [
        'Analyze different macro split scenarios',
        'Calculate calorie cycling strategies',
        'Compare activity level modifications',
        'Quantify potential progress timelines'
      ]
    };

    return suggestions[mode].slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Classify the type of coaching provided
   */
  private classifyCoachingType(content: string, mode: CoachingMode): CoachingResponse['coachingType'] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('reality') || lowerContent.includes('myth') || lowerContent.includes('truth')) {
      return 'reality-check';
    } else if (lowerContent.includes('analysis') || lowerContent.includes('calculate') || lowerContent.includes('data')) {
      return 'analysis';
    } else if (lowerContent.includes('encourage') || lowerContent.includes('motivation') || lowerContent.includes('positive')) {
      return 'encouragement';
    } else {
      return 'tips';
    }
  }

  /**
   * Calculate confidence level based on response characteristics
   */
  private calculateConfidenceLevel(response: AIResponse): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence for successful primary model usage
    if (!response.usedFallback) confidence += 0.1;
    
    // Lower confidence for very fast responses (might be cached/simple)
    if (response.responseTime < 1000) confidence -= 0.1;
    
    // Higher confidence for appropriate token usage
    if (response.tokenUsage.output > 200 && response.tokenUsage.output < 1000) {
      confidence += 0.1;
    }

    // Lower confidence if there are warnings
    if (response.warnings && response.warnings.length > 0) {
      confidence -= 0.05 * response.warnings.length;
    }

    return Math.max(0.3, Math.min(0.95, confidence));
  }

  /**
   * Extract model-specific insights
   */
  private extractModelSpecificInsights(modelId: AIModelId, content: string): string {
    const insights: Record<AIModelId, string> = {
      'gpt-4o-mini': 'GPT-4o-mini provided balanced, well-structured advice with good practical focus',
      'qwen3-235b': 'Qwen3-235b delivered systematic, actionable guidance with clear organization',
      'gemini-2.0-flash-exp': 'Gemini 2.0 Flash provided analytical insights with strong data integration',
      'gpt-oss-120b': 'GPT-OSS-120b provided comprehensive open-source knowledge with detailed insights'
    };

    return insights[modelId] || 'AI model provided personalized coaching advice';
  }

  /**
   * Get fallback coaching when AI service fails
   */
  private getFallbackCoaching(request: CoachingRequest): CoachingResponse {
    const { mode, userData, tdeeResult } = request;

    let fallbackContent = '';
    let coachingType: CoachingResponse['coachingType'] = 'tips';

    switch (mode) {
      case 'reality-check':
        fallbackContent = this.getFallbackRealityCheck(userData, tdeeResult);
        coachingType = 'reality-check';
        break;
      case 'educational':
        fallbackContent = this.getFallbackEducational(userData, tdeeResult);
        coachingType = 'analysis';
        break;
      case 'analytical':
        fallbackContent = this.getFallbackAnalytical(userData, tdeeResult);
        coachingType = 'analysis';
        break;
      default:
        fallbackContent = this.getFallbackSupportive(userData, tdeeResult);
        coachingType = 'encouragement';
    }

    return {
      content: fallbackContent,
      modelUsed: 'gpt-4o-mini', // Fallback attribution
      usedFallback: true,
      responseTime: 100,
      estimatedCost: 0,
      tokenUsage: { input: 0, output: 0, total: 0 },
      warnings: ['AI service unavailable - using rule-based coaching'],
      mode,
      coachingType,
      confidenceLevel: 0.6,
      followUpSuggestions: this.generateFollowUpSuggestions(mode, []),
      safetyWarnings: ['Always consult healthcare providers for medical advice']
    };
  }

  /**
   * Fallback reality check coaching
   */
  private getFallbackRealityCheck(userData: any, tdeeResult: any): string {
    const proteinTarget = Math.round(userData.weight * (userData.units === 'metric' ? 1.65 : 0.75));
    
    return `🚨 **REALITY CHECK TIME** 🚨

1. **Your actual daily calorie needs are ${tdeeResult.tdee} calories** - not the 1200-1500 you might see in magazines. Eating too little will slow your metabolism and make you miserable.

2. **You need about ${proteinTarget}g of protein daily** - not the 50g RDA minimum. Most people massively under-eat protein and wonder why they're always hungry and losing muscle.

3. **Your ${userData.jobActivity} job activity level matters more than that 30-minute workout** - you burn ${tdeeResult.components.jobActivity} calories just from work activities vs ${tdeeResult.components.exercise} from intentional exercise.

4. **Sustainable changes beat perfect plans** - The "perfect" diet you can't stick to is infinitely worse than the "okay" approach you can maintain for years.

Remember: There are no shortcuts, supplements don't replace fundamentals, and consistency beats perfection every single time.`;
  }

  /**
   * Fallback educational coaching
   */
  private getFallbackEducational(userData: any, tdeeResult: any): string {
    return `📚 **UNDERSTANDING YOUR METABOLISM** 📚

1. **Your TDEE Breakdown:**
   - BMR (${tdeeResult.components?.bmr || tdeeResult.bmr} cal): Energy to keep you alive at rest
   - NEAT (${(tdeeResult.components?.neat || 0) + (tdeeResult.components?.jobActivity || 0)} cal): Daily activities and fidgeting
   - Exercise (${tdeeResult.components?.exercise || 0} cal): Planned physical activity
   - TEF (~200 cal): Energy to digest food (10% of intake)

2. **Protein Synthesis Science:** Your muscles need 0.75g protein per lb bodyweight for optimal muscle protein synthesis - that's about ${Math.round(userData.weight * (userData.units === 'metric' ? 1.65 : 0.75))}g for you.

3. **Activity Level Impact:** Your ${userData.steps} daily steps contribute significantly to your NEAT. Research shows 8,000+ steps daily correlates with better metabolic health.

4. **Progressive Adaptation:** Your body adapts to changes in ~2-4 weeks. Expect metabolic adjustments and plan accordingly rather than panic when progress slows.`;
  }

  /**
   * Fallback analytical coaching
   */
  private getFallbackAnalytical(userData: any, tdeeResult: any): string {
    const deficitCalories = Math.round(tdeeResult.tdee * 0.15); // 15% deficit
    const surplusCalories = Math.round(tdeeResult.tdee * 0.10); // 10% surplus
    const proteinCals = Math.round(userData.weight * (userData.units === 'metric' ? 1.65 : 0.75) * 4);
    const fatCals = Math.round(userData.weight * (userData.units === 'metric' ? 1.1 : 0.5) * 9);
    
    return `📊 **DATA-DRIVEN ANALYSIS** 📊

1. **Calorie Targets by Goal:**
   - Fat Loss: ${tdeeResult.tdee - deficitCalories} calories (-15% deficit)
   - Maintenance: ${tdeeResult.tdee} calories
   - Muscle Gain: ${tdeeResult.tdee + surplusCalories} calories (+10% surplus)

2. **Optimized Macro Distribution:**
   - Protein: ${Math.round(proteinCals/4)}g (${proteinCals} cal) - 25-30%
   - Fat: ${Math.round(fatCals/9)}g (${fatCals} cal) - 25-30%  
   - Carbs: Fill remainder (~40-50% of calories)

3. **Activity Efficiency Score:** Your exercise burns ${tdeeResult.components.exercise} cal while daily steps contribute ${tdeeResult.components.neat} cal. Consider increasing step target to 10,000+ for additional 100-150 cal daily.

4. **Timeline Projections:** With 15% deficit: ~1-2 lbs/month fat loss. With 10% surplus: ~0.5-1 lb/month muscle gain (with proper training).`;
  }

  /**
   * Fallback supportive coaching
   */
  private getFallbackSupportive(userData: any, tdeeResult: any): string {
    const proteinTarget = Math.round(userData.weight * (userData.units === 'metric' ? 1.65 : 0.75));
    
    return `💪 **YOUR PERSONALIZED SUCCESS PLAN** 💪

1. **You're burning ${tdeeResult.tdee} calories daily** - that's fantastic! Your body is working hard with your ${userData.jobActivity} job and ${userData.steps} daily steps. You have a solid foundation to build on.

2. **Aim for ${proteinTarget}g protein daily** to support your goals. Think: palm-sized protein at each meal, Greek yogurt snacks, or a protein smoothie. Your muscles will thank you!

3. **Your ${userData.exercises?.[0]?.type || 'current activity'} routine is contributing ${tdeeResult.components.exercise} calories of burn** - every bit of movement counts and you're already ahead of most people!

4. **Small, consistent changes create lasting results.** Focus on adding one healthy habit this week, whether it's an extra glass of water, 5 more minutes of movement, or one more serving of vegetables.

You've got this! Your body is already doing amazing things - we're just fine-tuning the engine. 🌟`;
  }

  /**
   * Update coaching context for future interactions
   */
  public updateContext(userId: string, context: Partial<CoachingContext>): void {
    const existing = this.coachingHistory.get(userId) || {
      userId,
      previousInteractions: 0,
      userGoals: [],
      successRate: 0.8,
      lastCoachingDate: new Date().toISOString(),
      preferredTone: 'gentle',
      strugglingAreas: []
    };

    const updated = { ...existing, ...context };
    this.coachingHistory.set(userId, updated);
  }

  /**
   * Get coaching context for user
   */
  public getContext(userId: string): CoachingContext | undefined {
    return this.coachingHistory.get(userId);
  }
}

// Export singleton instance
export const advancedAICoaching = AdvancedAICoachingService.getInstance();

/**
 * Convenience function for getting coaching advice
 */
export async function getAdvancedCoaching(
  mode: CoachingMode,
  userData: any,
  tdeeResult: any,
  options?: {
    context?: CoachingContext;
    specificQuestion?: string;
    preferredModel?: AIModelId;
    userPreferences?: UserAIPreferences;
  }
): Promise<CoachingResponse> {
  return advancedAICoaching.getCoaching({
    mode,
    userData,
    tdeeResult,
    ...options
  });
}