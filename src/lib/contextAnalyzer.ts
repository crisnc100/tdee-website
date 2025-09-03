/**
 * Context Analysis System for AI Fitness Coach
 * 
 * Analyzes user queries to determine relevance to TDEE data and
 * categorizes questions for appropriate response generation.
 * 
 * Features:
 * - Query categorization (tdee-relevant, general-fitness, mixed)
 * - Topic detection and extraction
 * - TDEE relevance scoring (0-100%)
 * - Response depth analysis
 * - Card type suggestions
 */

import { EnhancedCardType } from '@/types/ai';

/**
 * Query analysis result with relevance scoring and categorization
 */
export interface QueryAnalysis {
  /** Primary category of the query */
  category: 'tdee-relevant' | 'general-fitness' | 'mixed';
  /** Detected topics in the query */
  topics: string[];
  /** Whether TDEE data is required for a complete response (0-100%) */
  tdeeRelevanceScore: number;
  /** Suggested card types for response */
  suggestedCardTypes: EnhancedCardType[];
  /** Recommended response depth */
  responseDepth: 'quick' | 'standard' | 'comprehensive';
  /** Should include user's TDEE data in context? */
  requiresTDEE: boolean;
  /** Query intent classification */
  intent: QueryIntent;
}

/**
 * User query intent classification
 */
export type QueryIntent = 
  | 'question'          // Asking for information
  | 'advice-seeking'    // Looking for recommendations
  | 'troubleshooting'   // Having issues, needs solutions
  | 'plan-request'      // Wants a structured plan
  | 'validation'        // Checking if doing something right
  | 'education'         // Learning about concepts
  | 'calculation'       // Needs numbers/math
  | 'progress-check';   // Tracking or evaluating progress

/**
 * Pre-compiled topic patterns for performance
 * Patterns are compiled once at module load time
 */
const TOPIC_PATTERNS_RAW = {
  // TDEE-specific topics (high relevance)
  tdeeCalculation: '\\b(tdee|total daily energy|maintenance calories|calorie needs|how many calories)\\b',
  deficit: '\\b(deficit|cut|cutting|lose weight|fat loss|calorie deficit)\\b',
  surplus: '\\b(surplus|bulk|bulking|gain weight|muscle gain|calorie surplus)\\b',
  bmr: '\\b(bmr|basal metabolic|resting metabolic|metabolism)\\b',
  
  // General fitness topics (low TDEE relevance)
  exercise: '\\b(exercise|workout|training|gym|cardio|weights|strength)\\b',
  form: '\\b(form|technique|proper|correct way|how to do)\\b',
  program: '\\b(program|routine|plan|schedule|split)\\b',
  injury: '\\b(injury|hurt|pain|sore|recovery|rehab)\\b',
  equipment: '\\b(equipment|gear|shoes|belt|straps|machine)\\b',
  
  // Nutrition topics (medium TDEE relevance)
  macros: '\\b(macros|protein|carbs|fats|macronutrients)\\b',
  meals: '\\b(meal|food|eat|diet|nutrition|recipe)\\b',
  supplements: '\\b(supplement|vitamin|creatine|protein powder|pre-workout)\\b',
  hydration: '\\b(water|hydration|drink|fluid)\\b',
  
  // Progress & goals (mixed relevance)
  progress: '\\b(progress|results|gains|improvement|plateau)\\b',
  goals: '\\b(goal|target|aim|want to|trying to|objective)\\b',
  timeline: '\\b(how long|when|timeline|weeks|months|duration)\\b',
  
  // Health & wellness (low TDEE relevance)
  sleep: '\\b(sleep|rest|recovery|tired|fatigue)\\b',
  stress: '\\b(stress|anxiety|mental|mood|motivation)\\b',
  health: '\\b(health|medical|condition|disease|doctor)\\b'
};

/**
 * Pre-compiled regex patterns for O(1) access
 */
const COMPILED_TOPIC_PATTERNS = new Map<string, RegExp>();

// Compile all patterns at module initialization
for (const [key, pattern] of Object.entries(TOPIC_PATTERNS_RAW)) {
  COMPILED_TOPIC_PATTERNS.set(key, new RegExp(pattern, 'i'));
}

/**
 * Query analysis cache for recently processed queries
 */
class QueryCache {
  private cache = new Map<string, { result: QueryAnalysis; timestamp: number }>();
  private maxSize = 100;
  private maxAge = 5 * 60 * 1000; // 5 minutes

  get(query: string): QueryAnalysis | null {
    const cached = this.cache.get(query.toLowerCase().trim());
    if (!cached) return null;
    
    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(query);
      return null;
    }
    
    return cached.result;
  }

  set(query: string, result: QueryAnalysis): void {
    const key = query.toLowerCase().trim();
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, { result, timestamp: Date.now() });
  }
}

// Global query cache instance
const queryCache = new QueryCache();

/**
 * Keywords that strongly indicate TDEE relevance
 */
const TDEE_INDICATORS = [
  'calories', 'tdee', 'maintenance', 'deficit', 'surplus', 'bmr',
  'metabolism', 'energy expenditure', 'calorie burn', 'caloric needs',
  'how many calories', 'should i eat', 'daily calories', 'calorie intake'
];

/**
 * Keywords that indicate general fitness questions
 */
const GENERAL_FITNESS_INDICATORS = [
  'form', 'technique', 'exercise', 'workout', 'program', 'routine',
  'sets', 'reps', 'weight', 'strength', 'cardio', 'flexibility',
  'injury', 'pain', 'sore', 'equipment', 'gym', 'home workout'
];

/**
 * Main context analyzer class
 */
export class ContextAnalyzer {
  /**
   * Analyze a user query and determine its context with caching
   */
  analyzeQuery(query: string): QueryAnalysis {
    // Check cache first
    const cached = queryCache.get(query);
    if (cached) {
      return cached;
    }
    
    const lowerQuery = query.toLowerCase();
    
    // Detect topics
    const topics = this.detectTopics(lowerQuery);
    
    // Calculate TDEE relevance score
    const tdeeRelevanceScore = this.calculateTDEERelevance(lowerQuery, topics);
    
    // Determine category
    const category = this.categorizeQuery(tdeeRelevanceScore);
    
    // Determine intent
    const intent = this.detectIntent(lowerQuery);
    
    // Determine response depth
    const responseDepth = this.determineResponseDepth(lowerQuery, intent);
    
    // Suggest card types
    const suggestedCardTypes = this.suggestCardTypes(topics, intent, category);
    
    const result: QueryAnalysis = {
      category,
      topics,
      tdeeRelevanceScore,
      suggestedCardTypes,
      responseDepth,
      requiresTDEE: tdeeRelevanceScore > 70,
      intent
    };
    
    // Cache the result
    queryCache.set(query, result);
    
    return result;
  }
  
  /**
   * Detect topics present in the query using pre-compiled patterns
   */
  private detectTopics(query: string): string[] {
    const detectedTopics: string[] = [];
    
    // Use pre-compiled patterns for O(1) access
    for (const [topic, pattern] of COMPILED_TOPIC_PATTERNS) {
      if (pattern.test(query)) {
        detectedTopics.push(topic);
      }
    }
    
    // Add custom topic detection for complex queries
    if (query.includes('lose') && query.includes('muscle')) {
      detectedTopics.push('body-recomposition');
    }
    
    if (query.includes('plateau') || query.includes('stuck')) {
      detectedTopics.push('troubleshooting');
    }
    
    return detectedTopics;
  }
  
  /**
   * Calculate TDEE relevance score (0-100%)
   */
  private calculateTDEERelevance(query: string, topics: string[]): number {
    let score = 0;
    
    // Check for direct TDEE indicators (high weight)
    for (const indicator of TDEE_INDICATORS) {
      if (query.includes(indicator)) {
        score += 15;
      }
    }
    
    // Check for general fitness indicators (negative weight)
    for (const indicator of GENERAL_FITNESS_INDICATORS) {
      if (query.includes(indicator)) {
        score -= 5;
      }
    }
    
    // Topic-based scoring
    const tdeeTopics = ['tdeeCalculation', 'deficit', 'surplus', 'bmr'];
    const nutritionTopics = ['macros', 'meals'];
    const fitnessTopics = ['exercise', 'form', 'program', 'equipment'];
    
    for (const topic of topics) {
      if (tdeeTopics.includes(topic)) {
        score += 25;
      } else if (nutritionTopics.includes(topic)) {
        score += 10;
      } else if (fitnessTopics.includes(topic)) {
        score -= 5;
      }
    }
    
    // Context clues
    if (query.includes('my tdee') || query.includes('my calories')) {
      score += 30;
    }
    
    if (query.includes('based on my') || query.includes('for me')) {
      score += 10;
    }
    
    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Categorize query based on relevance score
   */
  private categorizeQuery(relevanceScore: number): 'tdee-relevant' | 'general-fitness' | 'mixed' {
    if (relevanceScore >= 70) {
      return 'tdee-relevant';
    } else if (relevanceScore <= 30) {
      return 'general-fitness';
    } else {
      return 'mixed';
    }
  }
  
  /**
   * Detect the intent behind the query
   */
  private detectIntent(query: string): QueryIntent {
    // Question patterns
    if (/^(what|how|why|when|where|which|who|is|are|can|should|could|would|will)\b/i.test(query)) {
      if (query.includes('calculate') || query.includes('many')) {
        return 'calculation';
      }
      return 'question';
    }
    
    // Advice seeking patterns
    if (/\b(should i|can i|would you recommend|suggest|advice|tips|help)\b/i.test(query)) {
      return 'advice-seeking';
    }
    
    // Troubleshooting patterns
    if (/\b(not working|stuck|plateau|problem|issue|wrong|mistake)\b/i.test(query)) {
      return 'troubleshooting';
    }
    
    // Plan request patterns
    if (/\b(plan|program|routine|schedule|design|create|build)\b/i.test(query)) {
      return 'plan-request';
    }
    
    // Validation patterns
    if (/\b(am i|is this|correct|right|good|okay|normal)\b/i.test(query)) {
      return 'validation';
    }
    
    // Progress check patterns
    if (/\b(progress|results|tracking|measure|evaluate)\b/i.test(query)) {
      return 'progress-check';
    }
    
    // Education patterns
    if (/\b(explain|understand|learn|teach|what is|how does)\b/i.test(query)) {
      return 'education';
    }
    
    // Default to question
    return 'question';
  }
  
  /**
   * Determine appropriate response depth
   */
  private determineResponseDepth(query: string, intent: QueryIntent): 'quick' | 'standard' | 'comprehensive' {
    // Quick responses for simple questions
    if (query.length < 50 && intent === 'question') {
      return 'quick';
    }
    
    // Comprehensive for plans and education
    if (intent === 'plan-request' || intent === 'education') {
      return 'comprehensive';
    }
    
    // Comprehensive for complex queries
    if (query.length > 200 || query.includes('?') && query.includes('also')) {
      return 'comprehensive';
    }
    
    // Quick for yes/no validation
    if (intent === 'validation' && (query.includes('yes') || query.includes('no'))) {
      return 'quick';
    }
    
    // Default to standard
    return 'standard';
  }
  
  /**
   * Suggest appropriate card types based on analysis
   */
  private suggestCardTypes(
    topics: string[], 
    intent: QueryIntent, 
    category: 'tdee-relevant' | 'general-fitness' | 'mixed'
  ): EnhancedCardType[] {
    const cardTypes: EnhancedCardType[] = [];
    
    // Intent-based cards
    switch (intent) {
      case 'question':
      case 'education':
        cardTypes.push('education', 'insight');
        break;
      case 'advice-seeking':
        cardTypes.push('action', 'quick-tip');
        break;
      case 'troubleshooting':
        cardTypes.push('myth-buster', 'action', 'insight');
        break;
      case 'plan-request':
        cardTypes.push('plan', 'action');
        break;
      case 'validation':
        cardTypes.push('insight', 'encouragement');
        break;
      case 'calculation':
        cardTypes.push('calculation', 'insight');
        break;
      case 'progress-check':
        cardTypes.push('progress', 'insight');
        break;
    }
    
    // Topic-based cards
    if (topics.includes('form') || topics.includes('exercise')) {
      cardTypes.push('form-check');
    }
    
    if (topics.includes('meals') || topics.includes('macros')) {
      cardTypes.push('nutrition');
    }
    
    if (topics.includes('sleep') || topics.includes('injury')) {
      cardTypes.push('recovery');
    }
    
    if (topics.includes('stress') || topics.includes('motivation')) {
      cardTypes.push('mindset');
    }
    
    // Add research card for comprehensive responses
    if (topics.length > 3) {
      cardTypes.push('research');
    }
    
    // Remove duplicates and limit to 4 cards
    return [...new Set(cardTypes)].slice(0, 4);
  }
  
  /**
   * Check if a query is asking about specific TDEE data
   */
  isAskingAboutTDEE(query: string): boolean {
    const tdeeQuestions = [
      /what.*my.*tdee/i,
      /how many calories.*i/i,
      /my maintenance/i,
      /my calorie.*needs/i,
      /should i eat/i,
      /my metabolism/i
    ];
    
    return tdeeQuestions.some(pattern => pattern.test(query));
  }
  
  /**
   * Generate contextual prompt additions based on analysis
   */
  generateContextPrompt(analysis: QueryAnalysis): string {
    const prompts: string[] = [];
    
    if (analysis.requiresTDEE) {
      prompts.push("Use the user's TDEE data to provide personalized recommendations.");
    } else {
      prompts.push("Focus on general fitness principles without emphasizing TDEE data.");
    }
    
    if (analysis.intent === 'troubleshooting') {
      prompts.push("Identify potential issues and provide actionable solutions.");
    }
    
    if (analysis.intent === 'education') {
      prompts.push("Explain concepts clearly with examples and analogies.");
    }
    
    if (analysis.responseDepth === 'quick') {
      prompts.push("Provide a concise, direct answer.");
    } else if (analysis.responseDepth === 'comprehensive') {
      prompts.push("Provide a thorough, detailed response with multiple perspectives.");
    }
    
    return prompts.join(' ');
  }
}

// Export singleton instance
export const contextAnalyzer = new ContextAnalyzer();