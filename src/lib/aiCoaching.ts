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

import { AIModelId, AIRequest, AIResponse, UserAIPreferences, QueryAnalysis } from '@/types/ai';
import { aiService } from '@/lib/aiService';
import { contextAnalyzer } from '@/lib/contextAnalyzer';

/**
 * Coaching modes with distinct approaches
 */
export type CoachingMode = 
  | 'supportive'      // Encouraging, motivational approach
  | 'reality-check'   // Direct, honest, myth-busting approach  
  | 'socratic'        // Questions-based learning, makes users think
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

  socratic: `You are a Socratic fitness coach who guides users to insights through thoughtful questions. You help them discover answers themselves while providing objective truth.

COACHING STYLE:
- Start with thought-provoking questions about their habits/beliefs
- Let them reflect and respond (or say "I don't know")
- Then provide the objective, evidence-based answer
- Ask follow-up questions to deepen understanding
- Example: "What do you think happens when you skip protein after workouts? [Wait for response] Here's what actually happens..."`,

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
    name: 'Professional Coach',
    userFriendlyName: '🎯 Adaptive Professional',
    description: 'Most human-like coach that adapts to your communication style',
    articulation: 'Balanced and natural - matches your energy and tone',
    strengths: [
      'Best at understanding context and nuance',
      'Adapts communication to match you',
      'Professional yet personable',
      'Excellent for sensitive topics'
    ],
    bestFor: ['personalized-coaching', 'long-term-planning', 'complex-situations'],
    personalityBoost: {
      supportive: 'Exceptionally empathetic and encouraging',
      'reality-check': 'Direct but never harsh, always constructive',
      socratic: 'Asks deeply insightful questions that really make you think',
      analytical: 'Provides comprehensive analysis with clear insights'
    }
  },

  'gpt-oss-120b': {
    name: 'Friendly Expert',
    userFriendlyName: '💬 Gym Buddy (Free)',
    description: 'Explains things like a knowledgeable friend at the gym',
    articulation: 'Conversational and flowing - like talking to an experienced workout partner',
    strengths: [
      'Most relatable and friendly tone',
      'Great at explaining through stories/examples',
      'Free with consistent quality',
      'Feels like actual conversation'
    ],
    bestFor: ['beginners', 'general-questions', 'friendly-advice'],
    personalityBoost: {
      supportive: 'Like a supportive gym buddy cheering you on',
      'reality-check': 'Straight talk from someone who cares',
      socratic: 'Asks questions like a curious friend helping you figure things out',
      analytical: 'Breaks down numbers in relatable terms'
    }
  },

  'qwen3-235b': {
    name: 'Sports Scientist',
    userFriendlyName: '🔬 Method-Based (Premium)',
    description: 'Shows its thinking process step-by-step like a sports scientist',
    articulation: 'Methodical reasoning - "First, let\'s consider... Then we can see..."',
    strengths: [
      'Shows you HOW it reaches conclusions',
      'Best for troubleshooting plateaus',
      'Excellent at "why isn\'t this working?" questions',
      'Breaks down complex problems systematically'
    ],
    bestFor: ['problem-solving', 'plateau-breaking', 'understanding-why'],
    personalityBoost: {
      supportive: 'Validates your efforts through logical analysis',
      'reality-check': 'Uses step-by-step logic to debunk myths',
      socratic: 'Guides you through reasoning chains with questions',
      analytical: 'Shows complete analytical thought process'
    }
  },

  'gemini-2.0-flash-exp': {
    name: 'Structured Trainer',
    userFriendlyName: '📋 Organized & Fast (Free)',
    description: 'Like a trainer with a clipboard - organized, structured, quick',
    articulation: 'Bullet points and lists - "Here are 3 key points..."',
    strengths: [
      'Fastest responses (2-3 seconds)',
      'Very organized and easy to scan',
      'Great for quick questions',
      'Excellent at creating structured plans'
    ],
    bestFor: ['quick-answers', 'meal-plans', 'structured-guidance'],
    personalityBoost: {
      supportive: 'Organized encouragement with clear action items',
      'reality-check': 'Bullet-pointed reality in digestible chunks',
      socratic: 'Asks structured questions in logical sequence',
      analytical: 'Presents data in clean, organized formats'
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
  socratic: {
    name: '🤔 Socratic Coach',
    shortName: 'Thinker',
    description: 'Guides you to answers through thoughtful questions',
    tone: 'Curious, thought-provoking, discovery-focused',
    bestFor: 'Those who learn best by thinking it through'
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

    // Analyze the query to determine context relevance with proper null handling
    const queryAnalysis = request.specificQuestion 
      ? contextAnalyzer.analyzeQuery(request.specificQuestion)
      : undefined;

    console.log('[AICoaching] Starting coaching request:', {
      mode,
      hasSpecificQuestion: !!request.specificQuestion,
      specificQuestion: request.specificQuestion?.substring(0, 100),
      tdeeRelevance: queryAnalysis?.tdeeRelevanceScore,
      category: queryAnalysis?.category,
      preferredModel
    });

    // Select optimal model for the coaching mode if none specified
    const selectedModel = preferredModel || this.selectOptimalModelForMode(mode);

    // Build model-specific prompt with context awareness
    const prompt = this.buildModelSpecificPrompt(
      selectedModel, 
      mode, 
      userData, 
      tdeeResult, 
      context,
      request.specificQuestion,
      queryAnalysis
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
      disableCache: true, // Always disable cache for coaching to ensure fresh responses
      queryAnalysis: queryAnalysis
    };

    try {
      const response = await aiService.request(aiRequest);
      
      // Log if fallback was used
      if (response.usedFallback) {
        console.log(`[AdvancedAICoaching] Used fallback model: ${response.modelUsed}`);
      }
      
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
        // GPT-OSS for friendly but direct truth
        return 'gpt-oss-120b';
      case 'socratic':
        // GPT-4o-mini best at nuanced questioning
        return 'gpt-4o-mini';
      case 'analytical':
        // Gemini for fast, structured data
        return 'gemini-2.0-flash-exp';
      case 'supportive':
      default:
        // GPT-OSS for friendly encouragement
        return 'gpt-oss-120b';
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
    specificQuestion?: string,
    queryAnalysis?: QueryAnalysis
  ): string {
    // Get personality-based coaching style
    const personalityPrompt = COACHING_PERSONALITIES[mode];
    
    // Get model-specific strength boost
    const modelStrength = MODEL_STRENGTHS[modelId];
    const strengthBoost = modelStrength?.personalityBoost?.[mode] || '';

    // Build user profile section - include TDEE only if relevant with proper null checking
    const includeTDEE = queryAnalysis?.requiresTDEE ?? true; // Default to true if no analysis
    const userProfile = this.buildUserProfile(userData, tdeeResult, includeTDEE);
    
    // Build context section if available
    const contextSection = context ? this.buildContextSection(context) : '';
    
    // Build specific question section with timestamp for uniqueness
    const questionSection = specificQuestion ? 
      `\n\nSPECIFIC QUESTION: ${specificQuestion}\n[Request Time: ${new Date().toISOString()}]` : '';

    // Build mode-specific task instructions (consider specific question and context)
    const taskInstructions = this.buildTaskInstructionsWithQuestion(mode, modelId, specificQuestion, queryAnalysis);

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
   * Now includes TDEE data only when relevant to the query
   */
  private buildUserProfile(userData: any, tdeeResult: any, includeTDEE: boolean = true): string {
    const exercises = userData.exercises?.map((ex: any) => 
      `${ex.type} ${ex.intensity} ${ex.minutes}min ${ex.frequency}x/week`
    ).join(', ') || userData.simpleExerciseLevel || 'None specified';

    const weightUnit = userData.units === 'metric' ? 'kg' : 'lbs';
    const heightDisplay = userData.units === 'metric' 
      ? `${userData.height}cm`
      : `${userData.heightFeet}'${userData.heightInches}"`;

    let profile = `USER PROFILE:
- Age: ${userData.age}, Gender: ${userData.gender}
- Weight: ${userData.weight}${weightUnit}, Height: ${heightDisplay}
- Job Activity: ${userData.jobActivity} (${userData.steps} daily steps)
- Body Fat: ${userData.bodyFat || 'Unknown'}%
- Exercise: ${exercises}`;

    // Only include TDEE data if relevant to the query
    if (includeTDEE && tdeeResult) {
      profile += `

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

    return profile;
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

      socratic: `TASK: Guide the user to insights through 2-3 thoughtful question-answer sequences:
1. Ask a thought-provoking question about their habits or beliefs
2. Give them space to think (say "Take a moment to consider...")
3. Then provide the evidence-based answer with explanation
4. Ask a follow-up question that builds on the insight
5. End by connecting their specific data to the lessons learned

Example format:
"What do you think happens to your metabolism when you skip meals? 
[Take a moment to consider...]
Here's what actually happens: [evidence-based explanation]
Now, looking at your TDEE of X calories, how might this affect your goals?"`,

      analytical: `TASK: Provide 3-4 data-driven analyses that:
1. Break down their calorie allocation by component
2. Analyze their activity efficiency and optimization potential
3. Calculate specific macro targets with reasoning
4. Identify the highest-impact changes based on their numbers
5. Provide quantified predictions for different scenarios`
    };

    return baseInstructions[mode];
  }
  
  private buildTaskInstructionsWithQuestion(mode: CoachingMode, modelId: AIModelId, specificQuestion?: string, queryAnalysis?: QueryAnalysis): string {
    // If there's a specific question, prioritize answering it directly
    if (specificQuestion && specificQuestion.toLowerCase().includes('user question:')) {
      const modeContext = {
        supportive: 'Provide a helpful, encouraging response',
        'reality-check': 'Give an honest, evidence-based response', 
        socratic: 'Ask thoughtful questions, then provide evidence-based answers',
        analytical: 'Give a data-driven, analytical response'
      };
      
      // Only mention TDEE if it's relevant to the query with safe access
      const tdeeContext = (queryAnalysis?.requiresTDEE ?? false)
        ? 'based on their TDEE data and fitness goals'
        : 'based on their fitness profile and goals';
      
      return `
Provide a helpful, specific response to this question ${tdeeContext}.`;
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
      socratic: 'You are a Socratic fitness coach who guides users to insights through thoughtful questions.',
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
      socratic: 0.7,
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
      socratic: 1500,  // Detailed questions and explanations
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
      socratic: [
        'What do you think is your biggest challenge?',
        'How do your habits align with your goals?',
        'What would success look like to you?',
        'Why do you think your current approach isn\'t working?'
      ],
      analytical: [
        'Analyze different macro split scenarios',
        'Calculate calorie cycling strategies',
        'Compare activity level modifications',
        'Quantify potential progress timelines'
      ]
    };

    return (suggestions[mode] || suggestions['supportive']).slice(0, 3); // Return top 3 suggestions
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
      case 'socratic':
        fallbackContent = this.getFallbackSocratic(userData, tdeeResult);
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
  private getFallbackSocratic(userData: any, tdeeResult: any): string {
    const proteinTarget = Math.round(userData.weight * (userData.units === 'metric' ? 1.65 : 0.75));
    
    return `🤔 **LET'S THINK THROUGH YOUR APPROACH** 🤔

**Question 1:** What do you think happens when you eat less than your TDEE of ${tdeeResult.tdee} calories?

*Take a moment to consider...*

**Answer:** Your body enters a deficit and starts using stored energy (fat and some muscle). The key is finding a sustainable deficit that preserves muscle.

**Question 2:** Why do you think you need ${proteinTarget}g of protein daily?

*Think about muscle protein synthesis...*

**Answer:** Your muscles constantly break down and rebuild. Without adequate protein (0.75g/lb), you lose muscle mass even if you're losing weight.

**Question 3:** How do you think your ${userData.steps} daily steps compare to dedicated exercise for fat loss?

**Answer:** NEAT (daily activities) often burns more calories than formal exercise! Your steps contribute significantly to your total daily burn.

**Your Turn:** What's one habit you think might be holding you back from your goals?`;
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