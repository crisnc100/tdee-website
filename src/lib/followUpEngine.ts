/**
 * Follow-Up Engine for Enhanced AI Fitness Coaching
 * 
 * This system analyzes coaching responses to generate intelligent follow-up
 * suggestions, maintains conversation context, and provides personalized
 * continuation paths based on user progress and interaction history.
 * 
 * Features:
 * - Response analysis for follow-up opportunities
 * - Contextual suggestion generation based on coaching mode
 * - Relevance ranking and personalization algorithms
 * - Smart question generation for deeper engagement
 * - Progress tracking integration for targeted suggestions
 */

import { CoachingMode } from './aiCoaching';
import { EnhancedCardType } from '@/types/ai';
import { knowledgeDomainAnalyzer, DomainAnalysis } from './knowledgeDomains';

/**
 * Follow-up suggestion with metadata
 */
export interface FollowUpSuggestion {
  id: string;
  text: string;
  type: FollowUpType;
  priority: number; // 0-10 scale (10 = highest priority)
  cardTypes: EnhancedCardType[];
  estimatedDepth: 'quick' | 'standard' | 'comprehensive';
  domain: string;
  reasoning: string;
  userBenefit: string;
  prerequisites?: string[];
}

/**
 * Types of follow-up suggestions
 */
export type FollowUpType = 
  | 'clarification'      // Ask for more details or clarify understanding
  | 'deepening'         // Go deeper into the current topic
  | 'application'       // How to apply the advice practically
  | 'troubleshooting'   // Identify and solve potential issues
  | 'expansion'         // Explore related topics or concepts
  | 'validation'        // Check understanding or confirm progress
  | 'motivation'        // Maintain engagement and motivation
  | 'measurement'       // Track progress or metrics
  | 'optimization'      // Improve or refine current approach
  | 'education';        // Learn underlying principles

/**
 * Response analysis result
 */
export interface ResponseAnalysis {
  mainTopics: string[];
  actionItems: string[];
  questionsRaised: string[];
  gaps: string[];
  depth: 'surface' | 'moderate' | 'deep';
  completeness: number; // 0-1 scale
  engagementLevel: number; // 0-1 scale
  followUpOpportunities: FollowUpOpportunity[];
}

/**
 * Follow-up opportunity identified in response
 */
export interface FollowUpOpportunity {
  trigger: string;
  opportunity: string;
  suggestedType: FollowUpType;
  confidence: number; // 0-1 scale
}

/**
 * User context for personalization
 */
export interface FollowUpContext {
  userId?: string;
  currentGoals: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  interactionHistory: InteractionHistoryItem[];
  strugglingAreas: string[];
  preferredLearningStyle: 'visual' | 'hands-on' | 'analytical' | 'conversational';
  availableTime: 'minimal' | 'moderate' | 'extensive';
  motivationLevel: number; // 0-10 scale
  lastInteractionDate?: string;
  completedActions: string[];
  pendingQuestions: string[];
}

/**
 * Historical interaction data
 */
export interface InteractionHistoryItem {
  timestamp: string;
  topic: string;
  coachingMode: CoachingMode;
  userSatisfaction?: number; // 0-10 scale
  followedUp: boolean;
  outcome?: 'helpful' | 'unclear' | 'actionable' | 'ignored';
}

/**
 * Suggestion generation criteria
 */
export interface SuggestionCriteria {
  maxSuggestions: number;
  minPriority: number;
  preferredTypes: FollowUpType[];
  excludeTypes: FollowUpType[];
  timeConstraint?: 'quick' | 'standard' | 'comprehensive';
  focusDomains?: string[];
}

/**
 * Response pattern for identifying follow-up opportunities
 */
interface ResponsePattern {
  pattern: RegExp;
  triggerPhrases: string[];
  followUpType: FollowUpType;
  priority: number;
  suggestionTemplate: string;
  domains: string[];
}

/**
 * Predefined response patterns for follow-up detection
 */
const RESPONSE_PATTERNS: ResponsePattern[] = [
  // Clarification patterns
  {
    pattern: /\b(depends|varies|might|could|possibly)\b/gi,
    triggerPhrases: ['depends on', 'varies based on', 'might want to', 'could try'],
    followUpType: 'clarification',
    priority: 8,
    suggestionTemplate: 'What specific details about your situation would help customize this advice?',
    domains: ['training', 'nutrition', 'recovery']
  },
  {
    pattern: /\b(if you|depending on|based on your)\b/gi,
    triggerPhrases: ['if you have', 'depending on your', 'based on your goals'],
    followUpType: 'clarification',
    priority: 7,
    suggestionTemplate: 'Could you share more details about your specific circumstances?',
    domains: ['training', 'nutrition', 'mindset']
  },
  
  // Application patterns
  {
    pattern: /\b(try|implement|start|begin|practice)\b/gi,
    triggerPhrases: ['try this', 'start by', 'implement this', 'begin with'],
    followUpType: 'application',
    priority: 9,
    suggestionTemplate: 'How can I help you implement this specific recommendation?',
    domains: ['training', 'nutrition', 'recovery', 'mindset']
  },
  {
    pattern: /\b(week|day|routine|schedule|plan)\b/gi,
    triggerPhrases: ['per week', 'daily routine', 'your schedule'],
    followUpType: 'application',
    priority: 8,
    suggestionTemplate: 'Would you like help creating a specific schedule for this?',
    domains: ['training', 'nutrition']
  },
  
  // Troubleshooting patterns
  {
    pattern: /\b(if.*not|doesn.t work|problem|issue|difficulty)\b/gi,
    triggerPhrases: ['if this doesn\'t work', 'having trouble', 'not seeing results'],
    followUpType: 'troubleshooting',
    priority: 9,
    suggestionTemplate: 'What challenges do you anticipate with implementing this approach?',
    domains: ['training', 'nutrition', 'mindset', 'recovery']
  },
  {
    pattern: /\b(adjust|modify|change|alternative)\b/gi,
    triggerPhrases: ['need to adjust', 'alternative approach', 'modify based on'],
    followUpType: 'troubleshooting',
    priority: 7,
    suggestionTemplate: 'Are there any obstacles that might require adjusting this plan?',
    domains: ['training', 'nutrition', 'advanced']
  },
  
  // Deepening patterns
  {
    pattern: /\b(research|studies|science|evidence)\b/gi,
    triggerPhrases: ['research shows', 'studies indicate', 'science behind'],
    followUpType: 'education',
    priority: 6,
    suggestionTemplate: 'Would you like to understand the science behind this recommendation?',
    domains: ['training', 'nutrition', 'supplements', 'advanced']
  },
  {
    pattern: /\b(principle|concept|theory|mechanism)\b/gi,
    triggerPhrases: ['the principle', 'key concept', 'theory behind'],
    followUpType: 'education',
    priority: 5,
    suggestionTemplate: 'Want to explore the underlying principles of this approach?',
    domains: ['training', 'nutrition', 'recovery', 'advanced']
  },
  
  // Measurement patterns
  {
    pattern: /\b(track|measure|monitor|progress|results)\b/gi,
    triggerPhrases: ['track progress', 'measure results', 'monitor changes'],
    followUpType: 'measurement',
    priority: 8,
    suggestionTemplate: 'How would you like to track your progress with this approach?',
    domains: ['training', 'nutrition', 'recovery', 'advanced']
  },
  {
    pattern: /\b(\d+\s*(weeks?|months?|days?))\b/gi,
    triggerPhrases: ['in 4 weeks', 'after 2 months', 'within days'],
    followUpType: 'measurement',
    priority: 7,
    suggestionTemplate: 'Should we set up specific milestones to track your progress?',
    domains: ['training', 'nutrition', 'mindset']
  },
  
  // Expansion patterns
  {
    pattern: /\b(also|additionally|furthermore|consider)\b/gi,
    triggerPhrases: ['you might also', 'additionally consider', 'furthermore'],
    followUpType: 'expansion',
    priority: 6,
    suggestionTemplate: 'Are you interested in exploring related strategies for even better results?',
    domains: ['training', 'nutrition', 'recovery', 'supplements']
  },
  {
    pattern: /\b(other|different|various|multiple)\b/gi,
    triggerPhrases: ['other options', 'different approaches', 'various methods'],
    followUpType: 'expansion',
    priority: 5,
    suggestionTemplate: 'Would you like to explore alternative approaches to this topic?',
    domains: ['training', 'nutrition', 'mindset', 'advanced']
  },
  
  // Optimization patterns
  {
    pattern: /\b(optimize|improve|enhance|maximize|fine-tune)\b/gi,
    triggerPhrases: ['optimize for', 'improve results', 'enhance performance'],
    followUpType: 'optimization',
    priority: 7,
    suggestionTemplate: 'How can we optimize this approach for your specific goals?',
    domains: ['training', 'nutrition', 'recovery', 'advanced']
  },
  {
    pattern: /\b(advanced|next level|plateau|stalled)\b/gi,
    triggerPhrases: ['advanced techniques', 'next level', 'break through plateau'],
    followUpType: 'optimization',
    priority: 8,
    suggestionTemplate: 'Ready to explore advanced strategies to break through plateaus?',
    domains: ['training', 'advanced', 'mindset']
  }
];

/**
 * Follow-up suggestion templates by coaching mode
 */
const MODE_SPECIFIC_SUGGESTIONS: Record<CoachingMode, Record<FollowUpType, string[]>> = {
  supportive: {
    clarification: [
      'I\'d love to understand your situation better so I can give you more personalized encouragement.',
      'Help me support you better by sharing more details about your experience.',
      'What specific challenges are you facing that I can help you overcome?'
    ],
    application: [
      'Let\'s create a step-by-step plan to help you succeed with this!',
      'I\'m here to support you through implementing these changes.',
      'How can we make this feel achievable and sustainable for you?'
    ],
    troubleshooting: [
      'If you hit any roadblocks, I\'m here to help you work through them.',
      'What support do you need to overcome potential challenges?',
      'Let\'s prepare for success by identifying any obstacles in advance.'
    ],
    deepening: [
      'I\'d love to explore this topic further to help you feel confident.',
      'Understanding the \'why\' behind advice can be really empowering.',
      'Would you like to dive deeper so you feel completely prepared?'
    ],
    expansion: [
      'There are some complementary strategies that could boost your success even more!',
      'I\'m excited to share some related tips that could accelerate your progress.',
      'Building on your momentum, here are some additional ways to thrive.'
    ],
    validation: [
      'How does this advice feel for you? I want to make sure it resonates.',
      'Does this approach align with what feels right for your lifestyle?',
      'I\'d love to hear your thoughts on this plan.'
    ],
    motivation: [
      'I believe in your ability to achieve this! How can I support your motivation?',
      'You\'ve got everything it takes to succeed. What would help you feel most confident?',
      'Your dedication is inspiring. How can we maintain this positive momentum?'
    ],
    measurement: [
      'Let\'s set up some positive milestones to celebrate your progress!',
      'Tracking your wins will help you see how amazing you\'re doing.',
      'How would you like to measure your success in a way that feels motivating?'
    ],
    optimization: [
      'I\'m excited to help you fine-tune this approach for even better results!',
      'You\'re doing great! Let\'s explore how we can make this even more effective.',
      'Building on your success, here are some ways to optimize further.'
    ],
    education: [
      'Understanding the science behind this can be really empowering!',
      'Would you like me to explain the \'why\' so you feel completely confident?',
      'Learning the principles behind this will help you make informed decisions.'
    ]
  },
  
  'reality-check': {
    clarification: [
      'Let\'s get specific about your situation so I can give you straight answers.',
      'I need more details to give you honest, practical advice.',
      'Stop beating around the bush - what\'s really going on?'
    ],
    application: [
      'Here\'s exactly how to implement this - no excuses.',
      'Time to stop planning and start doing. Here\'s your action plan.',
      'Cut through the complexity and focus on what actually matters.'
    ],
    troubleshooting: [
      'Let\'s identify what\'s really preventing your progress.',
      'Stop making excuses and let\'s solve the real problems.',
      'What obstacles are you actually facing vs. what you think you\'re facing?'
    ],
    deepening: [
      'Let\'s dig into the reality of why this approach works.',
      'Time to understand the truth behind common fitness myths.',
      'Here\'s what actually happens, not what marketing tells you.'
    ],
    expansion: [
      'Now that you understand this, let\'s tackle the other myths holding you back.',
      'Time to expand your understanding of what actually works.',
      'Let\'s address the other misconceptions that might be sabotaging you.'
    ],
    validation: [
      'Are you being honest with yourself about implementing this?',
      'Let\'s make sure you understand what this really requires.',
      'Time for a reality check - are you actually going to do this?'
    ],
    motivation: [
      'Stop looking for motivation and start building systems.',
      'The truth is, motivation is overrated - discipline is what works.',
      'Ready to face the reality of what success actually requires?'
    ],
    measurement: [
      'Let\'s track what actually matters, not vanity metrics.',
      'Time to measure real progress, not feel-good numbers.',
      'Here\'s how to honestly assess if this is working.'
    ],
    optimization: [
      'Let\'s cut out what doesn\'t work and focus on what does.',
      'Time to optimize based on reality, not wishful thinking.',
      'Here\'s how to actually improve your results, not just feel better.'
    ],
    education: [
      'Time to learn what actually works, not what sounds good.',
      'Let\'s separate science from marketing nonsense.',
      'Here\'s the truth about this topic that most people ignore.'
    ]
  },
  
  socratic: {
    clarification: [
      'What questions should you be asking yourself about your specific situation?',
      'How might your unique circumstances influence this approach?',
      'What do you think would happen if we considered your specific context?'
    ],
    application: [
      'How do you think you could integrate this into your current routine?',
      'What would successful implementation look like for you?',
      'How might you adapt this advice to fit your lifestyle?'
    ],
    troubleshooting: [
      'What obstacles do you anticipate, and how might you overcome them?',
      'What has prevented similar strategies from working for you in the past?',
      'How would you solve these potential challenges before they arise?'
    ],
    deepening: [
      'What do you think is the underlying principle that makes this work?',
      'How does this connect to what you already know about fitness?',
      'What questions does this raise about your current understanding?'
    ],
    expansion: [
      'How might this principle apply to other areas of your fitness journey?',
      'What connections do you see between this and other concepts we\'ve discussed?',
      'What related topics are you curious to explore?'
    ],
    validation: [
      'How well does this align with your personal experience and goals?',
      'What feels right about this approach, and what raises questions for you?',
      'How would you test whether this advice is working for you?'
    ],
    motivation: [
      'What would keep you motivated to continue with this approach?',
      'How does this fit with your deeper reasons for pursuing fitness?',
      'What would success with this approach mean to you personally?'
    ],
    measurement: [
      'How would you know if this approach is working for you?',
      'What metrics would be most meaningful for tracking your progress?',
      'How might you measure success beyond just numbers?'
    ],
    optimization: [
      'How might you refine this approach as you gain more experience?',
      'What would the next level of this strategy look like for you?',
      'How could you make this approach even more effective over time?'
    ],
    education: [
      'What do you think explains why this approach is effective?',
      'How does this challenge or confirm your existing beliefs?',
      'What would you want to understand more deeply about this topic?'
    ]
  },
  
  analytical: {
    clarification: [
      'What specific data points would help optimize this recommendation for you?',
      'Which variables in your situation should we quantify for better precision?',
      'What metrics would help us customize this approach to your exact needs?'
    ],
    application: [
      'Let\'s create a systematic implementation plan with measurable milestones.',
      'How can we structure this approach for maximum efficiency and trackability?',
      'What\'s the optimal timeline and progression for implementing this strategy?'
    ],
    troubleshooting: [
      'Let\'s analyze the potential failure points and create contingency protocols.',
      'What data would indicate that adjustments are needed to this approach?',
      'How can we systematically identify and solve implementation challenges?'
    ],
    deepening: [
      'What does the research data tell us about the mechanisms behind this approach?',
      'Let\'s examine the quantitative evidence supporting this strategy.',
      'How do the numbers and studies support this recommendation?'
    ],
    expansion: [
      'What related metrics and strategies could compound these results?',
      'How do other variables in your fitness equation interact with this approach?',
      'What additional optimizations could we layer onto this foundation?'
    ],
    validation: [
      'What metrics would confirm that this approach is optimal for your goals?',
      'How can we validate the effectiveness of this strategy with data?',
      'What benchmarks should we establish to measure success?'
    ],
    motivation: [
      'What data-driven feedback loops would maintain your engagement with this approach?',
      'How can we gamify your progress tracking to maintain consistent execution?',
      'What metrics and milestones would keep you motivated long-term?'
    ],
    measurement: [
      'Let\'s establish a comprehensive tracking system for all relevant variables.',
      'What\'s the optimal frequency and method for measuring progress?',
      'How can we analyze your progress data to optimize results continuously?'
    ],
    optimization: [
      'Let\'s run the numbers to fine-tune this approach for maximum efficiency.',
      'What variables should we adjust to optimize your risk-reward ratio?',
      'How can we systematically improve this strategy based on your response data?'
    ],
    education: [
      'What does the meta-analysis data reveal about this approach?',
      'Let\'s examine the statistical evidence and effect sizes for this strategy.',
      'How do the research findings translate to practical applications for your situation?'
    ]
  }
};

/**
 * Follow-Up Engine for generating intelligent suggestions
 */
export class FollowUpEngine {
  private responsePatterns: ResponsePattern[];
  private suggestionTemplates: Record<CoachingMode, Record<FollowUpType, string[]>>;
  
  constructor() {
    this.responsePatterns = RESPONSE_PATTERNS;
    this.suggestionTemplates = MODE_SPECIFIC_SUGGESTIONS;
  }
  
  /**
   * Analyze a coaching response for follow-up opportunities
   */
  analyzeResponse(response: string, coachingMode: CoachingMode): ResponseAnalysis {
    const mainTopics = this.extractMainTopics(response);
    const actionItems = this.extractActionItems(response);
    const questionsRaised = this.extractQuestions(response);
    const gaps = this.identifyGaps(response);
    const depth = this.assessDepth(response);
    const completeness = this.assessCompleteness(response);
    const engagementLevel = this.assessEngagementLevel(response, coachingMode);
    const followUpOpportunities = this.identifyFollowUpOpportunities(response);
    
    return {
      mainTopics,
      actionItems,
      questionsRaised,
      gaps,
      depth,
      completeness,
      engagementLevel,
      followUpOpportunities
    };
  }
  
  /**
   * Generate follow-up suggestions based on response analysis and context
   */
  generateSuggestions(
    analysis: ResponseAnalysis,
    coachingMode: CoachingMode,
    context: FollowUpContext,
    criteria: SuggestionCriteria = { maxSuggestions: 4, minPriority: 5, preferredTypes: [], excludeTypes: [] }
  ): FollowUpSuggestion[] {
    const suggestions: FollowUpSuggestion[] = [];
    let suggestionId = 1;
    
    // Generate suggestions from identified opportunities
    for (const opportunity of analysis.followUpOpportunities) {
      if (criteria.excludeTypes.includes(opportunity.suggestedType)) continue;
      
      const suggestion = this.createSuggestionFromOpportunity(
        opportunity,
        coachingMode,
        context,
        `follow-${suggestionId++}`
      );
      
      if (suggestion && suggestion.priority >= criteria.minPriority) {
        suggestions.push(suggestion);
      }
    }
    
    // Generate context-based suggestions
    const contextSuggestions = this.generateContextBasedSuggestions(
      analysis,
      coachingMode,
      context,
      criteria
    );
    
    suggestions.push(...contextSuggestions);
    
    // Generate mode-specific suggestions
    const modeSuggestions = this.generateModeSpecificSuggestions(
      coachingMode,
      context,
      criteria,
      suggestions.length
    );
    
    suggestions.push(...modeSuggestions);
    
    // Rank and filter suggestions
    const rankedSuggestions = this.rankSuggestionsByRelevance(suggestions, context);
    const filteredSuggestions = this.applySuggestionCriteria(rankedSuggestions, criteria);
    
    return filteredSuggestions.slice(0, criteria.maxSuggestions);
  }
  
  /**
   * Personalize suggestions based on user context and history
   */
  personalizeSuggestions(
    suggestions: FollowUpSuggestion[],
    context: FollowUpContext
  ): FollowUpSuggestion[] {
    return suggestions.map(suggestion => {
      let personalizedSuggestion = { ...suggestion };
      
      // Adjust priority based on user history
      if (context.strugglingAreas.some(area => suggestion.domain.includes(area))) {
        personalizedSuggestion.priority += 2;
      }
      
      // Adjust for experience level
      if (context.experienceLevel === 'beginner' && suggestion.type === 'education') {
        personalizedSuggestion.priority += 1;
        personalizedSuggestion.estimatedDepth = 'standard';
      } else if (context.experienceLevel === 'advanced' && suggestion.type === 'optimization') {
        personalizedSuggestion.priority += 1;
      }
      
      // Adjust for available time
      if (context.availableTime === 'minimal' && suggestion.estimatedDepth === 'comprehensive') {
        personalizedSuggestion.priority -= 2;
      } else if (context.availableTime === 'extensive' && suggestion.estimatedDepth === 'quick') {
        personalizedSuggestion.priority -= 1;
      }
      
      // Adjust for learning style
      if (context.preferredLearningStyle === 'analytical' && suggestion.type === 'measurement') {
        personalizedSuggestion.priority += 1;
      } else if (context.preferredLearningStyle === 'hands-on' && suggestion.type === 'application') {
        personalizedSuggestion.priority += 1;
      }
      
      // Avoid recently covered topics
      const recentTopics = context.interactionHistory
        .slice(-5)
        .map(item => item.topic);
      
      if (recentTopics.some(topic => suggestion.text.toLowerCase().includes(topic.toLowerCase()))) {
        personalizedSuggestion.priority -= 1;
      }
      
      // Boost priority for pending questions
      if (context.pendingQuestions.some(question => 
        this.areTopicsRelated(question, suggestion.text))) {
        personalizedSuggestion.priority += 2;
      }
      
      return personalizedSuggestion;
    });
  }
  
  /**
   * Extract main topics from response
   */
  private extractMainTopics(response: string): string[] {
    const topics: string[] = [];
    const topicPatterns = [
      /\b(protein|carb|fat|macro|nutrition|diet|meal)\w*/gi,
      /\b(exercise|workout|training|strength|cardio|lift)\w*/gi,
      /\b(sleep|rest|recovery|stress|fatigue)\w*/gi,
      /\b(goal|motivation|habit|mindset|psychology)\w*/gi,
      /\b(supplement|vitamin|creatine|protein powder)\w*/gi
    ];
    
    topicPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        topics.push(...matches.map(match => match.toLowerCase()));
      }
    });
    
    // Remove duplicates and return unique topics
    return Array.from(new Set(topics)).slice(0, 5);
  }
  
  /**
   * Extract action items from response
   */
  private extractActionItems(response: string): string[] {
    const actionPatterns = [
      /try to \w+[^.!?]*/gi,
      /start by \w+[^.!?]*/gi,
      /make sure to \w+[^.!?]*/gi,
      /aim for \w+[^.!?]*/gi,
      /focus on \w+[^.!?]*/gi,
      /\d+\.[\s]*[A-Z][^.!?]*[.!?]/g
    ];
    
    const actionItems: string[] = [];
    
    actionPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        actionItems.push(...matches.map(match => match.trim()));
      }
    });
    
    return actionItems.slice(0, 5);
  }
  
  /**
   * Extract questions from response
   */
  private extractQuestions(response: string): string[] {
    const questionPattern = /[^.!?]*\?/g;
    const questions = response.match(questionPattern);
    return questions ? questions.map(q => q.trim()).slice(0, 3) : [];
  }
  
  /**
   * Identify gaps or areas needing more detail
   */
  private identifyGaps(response: string): string[] {
    const gaps: string[] = [];
    const gapIndicators = [
      { pattern: /\bmight\b.*\bvary\b/gi, gap: 'individual variation not addressed' },
      { pattern: /\bdepends\b.*\bgoals\b/gi, gap: 'goal-specific guidance missing' },
      { pattern: /\bgenerally\b|\busually\b|\btypically\b/gi, gap: 'specific recommendations needed' },
      { pattern: /\bconsult\b.*\bdoctor\b/gi, gap: 'medical considerations flagged' },
      { pattern: /\bmore research\b|\bstudies needed\b/gi, gap: 'evidence limitations noted' }
    ];
    
    gapIndicators.forEach(({ pattern, gap }) => {
      if (pattern.test(response)) {
        gaps.push(gap);
      }
    });
    
    return gaps;
  }
  
  /**
   * Assess response depth
   */
  private assessDepth(response: string): 'surface' | 'moderate' | 'deep' {
    const wordCount = response.split(/\s+/).length;
    const complexityMarkers = (response.match(/\b(because|research|study|mechanism|principle|evidence)\b/gi) || []).length;
    const exampleCount = (response.match(/\b(example|instance|such as|like)\b/gi) || []).length;
    
    if (wordCount > 500 && complexityMarkers > 3 && exampleCount > 2) {
      return 'deep';
    } else if (wordCount > 200 && (complexityMarkers > 1 || exampleCount > 1)) {
      return 'moderate';
    } else {
      return 'surface';
    }
  }
  
  /**
   * Assess response completeness
   */
  private assessCompleteness(response: string): number {
    const completenessFactors = [
      { pattern: /\bwhy\b.*\bworks?\b/gi, weight: 0.2, name: 'explanation' },
      { pattern: /\bhow\b.*\b(do|implement|start)\b/gi, weight: 0.3, name: 'implementation' },
      { pattern: /\btrack\b|\bmeasure\b|\bmonitor\b/gi, weight: 0.2, name: 'measurement' },
      { pattern: /\bif.*not\b|\balternative\b|\badjust\b/gi, weight: 0.2, name: 'contingency' },
      { pattern: /\bresearch\b|\bstud(y|ies)\b|\bevidence\b/gi, weight: 0.1, name: 'backing' }
    ];
    
    let completenessScore = 0;
    
    completenessFactors.forEach(factor => {
      if (factor.pattern.test(response)) {
        completenessScore += factor.weight;
      }
    });
    
    return Math.min(1, completenessScore);
  }
  
  /**
   * Assess engagement level of response
   */
  private assessEngagementLevel(response: string, mode: CoachingMode): number {
    const modeEngagementPatterns: Record<CoachingMode, RegExp[]> = {
      supportive: [/\b(you can|you're|believe|excited|proud)\b/gi, /[!]{1,2}/g],
      'reality-check': [/\b(truth|reality|fact|actually|honestly)\b/gi, /\b(stop|don't|won't)\b/gi],
      socratic: [/\?/g, /\b(think|consider|what if|how)\b/gi],
      analytical: [/\b(data|number|calculate|optimize|measure)\b/gi, /\b(\d+%?|\d+\.\d+)\b/g]
    };
    
    const patterns = modeEngagementPatterns[mode] || [];
    let engagementScore = 0.5; // Base score
    
    patterns.forEach(pattern => {
      const matches = response.match(pattern) || [];
      engagementScore += matches.length * 0.05;
    });
    
    // Check for personal pronouns (increases engagement)
    const personalPronouns = response.match(/\b(you|your|I'll|let's|we)\b/gi) || [];
    engagementScore += personalPronouns.length * 0.02;
    
    return Math.min(1, engagementScore);
  }
  
  /**
   * Identify follow-up opportunities using pattern matching
   */
  private identifyFollowUpOpportunities(response: string): FollowUpOpportunity[] {
    const opportunities: FollowUpOpportunity[] = [];
    
    this.responsePatterns.forEach(pattern => {
      const matches = response.match(pattern.pattern) || [];
      const triggerMatches = pattern.triggerPhrases.filter(trigger => 
        response.toLowerCase().includes(trigger)
      );
      
      if (matches.length > 0 || triggerMatches.length > 0) {
        const confidence = Math.min(1, (matches.length * 0.3) + (triggerMatches.length * 0.4));
        
        opportunities.push({
          trigger: triggerMatches[0] || matches[0] || 'pattern match',
          opportunity: pattern.suggestionTemplate,
          suggestedType: pattern.followUpType,
          confidence
        });
      }
    });
    
    return opportunities.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Create suggestion from identified opportunity
   */
  private createSuggestionFromOpportunity(
    opportunity: FollowUpOpportunity,
    mode: CoachingMode,
    context: FollowUpContext,
    id: string
  ): FollowUpSuggestion | null {
    const modeTemplates = this.suggestionTemplates[mode];
    const typeTemplates = modeTemplates[opportunity.suggestedType];
    
    if (!typeTemplates || typeTemplates.length === 0) return null;
    
    // Select appropriate template based on context
    const template = this.selectTemplateForContext(typeTemplates, context);
    
    // Determine domain based on opportunity trigger
    const domain = this.determineDomainFromTrigger(opportunity.trigger);
    
    // Calculate priority based on opportunity confidence and context
    const basePriority = Math.round(opportunity.confidence * 8) + 2;
    
    return {
      id,
      text: template,
      type: opportunity.suggestedType,
      priority: basePriority,
      cardTypes: this.getCardTypesForFollowUpType(opportunity.suggestedType),
      estimatedDepth: this.getDepthForFollowUpType(opportunity.suggestedType, context),
      domain,
      reasoning: `Detected ${opportunity.suggestedType} opportunity from: "${opportunity.trigger}"`,
      userBenefit: this.getUserBenefitForType(opportunity.suggestedType),
      prerequisites: this.getPrerequisitesForType(opportunity.suggestedType, context)
    };
  }
  
  /**
   * Generate context-based suggestions
   */
  private generateContextBasedSuggestions(
    analysis: ResponseAnalysis,
    mode: CoachingMode,
    context: FollowUpContext,
    criteria: SuggestionCriteria
  ): FollowUpSuggestion[] {
    const suggestions: FollowUpSuggestion[] = [];
    let idCounter = 100;
    
    // Suggest based on completeness gaps
    if (analysis.completeness < 0.7) {
      const gapType: FollowUpType = analysis.completeness < 0.4 ? 'clarification' : 'deepening';
      const template = this.selectTemplateForContext(
        this.suggestionTemplates[mode][gapType],
        context
      );
      
      suggestions.push({
        id: `context-${idCounter++}`,
        text: template,
        type: gapType,
        priority: 7,
        cardTypes: this.getCardTypesForFollowUpType(gapType),
        estimatedDepth: 'standard',
        domain: 'general',
        reasoning: `Low completeness score (${analysis.completeness.toFixed(2)}) indicates need for ${gapType}`,
        userBenefit: 'Get more comprehensive and actionable guidance'
      });
    }
    
    // Suggest based on identified gaps
    for (const gap of analysis.gaps.slice(0, 2)) {
      const gapSuggestion = this.createGapBasedSuggestion(gap, mode, context, `gap-${idCounter++}`);
      if (gapSuggestion) {
        suggestions.push(gapSuggestion);
      }
    }
    
    // Suggest based on user goals alignment
    const goalAlignedSuggestion = this.createGoalAlignedSuggestion(
      context.currentGoals,
      mode,
      context,
      `goal-${idCounter++}`
    );
    if (goalAlignedSuggestion) {
      suggestions.push(goalAlignedSuggestion);
    }
    
    return suggestions;
  }
  
  /**
   * Generate mode-specific suggestions
   */
  private generateModeSpecificSuggestions(
    mode: CoachingMode,
    context: FollowUpContext,
    criteria: SuggestionCriteria,
    existingCount: number
  ): FollowUpSuggestion[] {
    const suggestions: FollowUpSuggestion[] = [];
    const remainingSlots = criteria.maxSuggestions - existingCount;
    
    if (remainingSlots <= 0) return suggestions;
    
    // Mode-specific follow-up strategies
    const modeStrategies: Record<CoachingMode, FollowUpType[]> = {
      supportive: ['motivation', 'application', 'validation'],
      'reality-check': ['troubleshooting', 'clarification', 'measurement'],
      socratic: ['deepening', 'expansion', 'education'],
      analytical: ['optimization', 'measurement', 'deepening']
    };
    
    const priorityTypes = modeStrategies[mode];
    let idCounter = 200;
    
    for (const type of priorityTypes.slice(0, remainingSlots)) {
      if (criteria.excludeTypes.includes(type)) continue;
      
      const template = this.selectTemplateForContext(
        this.suggestionTemplates[mode][type],
        context
      );
      
      suggestions.push({
        id: `mode-${idCounter++}`,
        text: template,
        type,
        priority: 6,
        cardTypes: this.getCardTypesForFollowUpType(type),
        estimatedDepth: this.getDepthForFollowUpType(type, context),
        domain: this.getDomainForModeType(mode, type),
        reasoning: `${mode} mode priority type: ${type}`,
        userBenefit: this.getUserBenefitForType(type)
      });
    }
    
    return suggestions;
  }
  
  /**
   * Rank suggestions by relevance to user context
   */
  private rankSuggestionsByRelevance(
    suggestions: FollowUpSuggestion[],
    context: FollowUpContext
  ): FollowUpSuggestion[] {
    return suggestions.sort((a, b) => {
      let scoreA = a.priority;
      let scoreB = b.priority;
      
      // Boost relevance for user's struggling areas
      if (context.strugglingAreas.some(area => a.domain.includes(area) || a.text.toLowerCase().includes(area))) {
        scoreA += 2;
      }
      if (context.strugglingAreas.some(area => b.domain.includes(area) || b.text.toLowerCase().includes(area))) {
        scoreB += 2;
      }
      
      // Boost relevance for user's current goals
      if (context.currentGoals.some(goal => a.text.toLowerCase().includes(goal.toLowerCase()))) {
        scoreA += 1;
      }
      if (context.currentGoals.some(goal => b.text.toLowerCase().includes(goal.toLowerCase()))) {
        scoreB += 1;
      }
      
      // Consider time availability
      if (context.availableTime === 'minimal') {
        if (a.estimatedDepth === 'quick') scoreA += 1;
        if (b.estimatedDepth === 'quick') scoreB += 1;
      } else if (context.availableTime === 'extensive') {
        if (a.estimatedDepth === 'comprehensive') scoreA += 1;
        if (b.estimatedDepth === 'comprehensive') scoreB += 1;
      }
      
      return scoreB - scoreA;
    });
  }
  
  /**
   * Apply suggestion criteria filters
   */
  private applySuggestionCriteria(
    suggestions: FollowUpSuggestion[],
    criteria: SuggestionCriteria
  ): FollowUpSuggestion[] {
    let filtered = suggestions.filter(suggestion => 
      suggestion.priority >= criteria.minPriority &&
      !criteria.excludeTypes.includes(suggestion.type)
    );
    
    // Apply preferred types boost
    if (criteria.preferredTypes.length > 0) {
      filtered = filtered.sort((a, b) => {
        const aPreferred = criteria.preferredTypes.includes(a.type) ? 1 : 0;
        const bPreferred = criteria.preferredTypes.includes(b.type) ? 1 : 0;
        
        if (aPreferred !== bPreferred) {
          return bPreferred - aPreferred;
        }
        
        return b.priority - a.priority;
      });
    }
    
    // Apply time constraint filter
    if (criteria.timeConstraint) {
      filtered = filtered.filter(suggestion => 
        this.matchesTimeConstraint(suggestion.estimatedDepth, criteria.timeConstraint!)
      );
    }
    
    // Apply domain focus filter
    if (criteria.focusDomains && criteria.focusDomains.length > 0) {
      filtered = filtered.filter(suggestion =>
        criteria.focusDomains!.some(domain => suggestion.domain.includes(domain))
      );
    }
    
    return filtered;
  }
  
  // Utility methods for suggestion creation
  private selectTemplateForContext(templates: string[], context: FollowUpContext): string {
    if (templates.length === 0) return 'Would you like to explore this topic further?';
    
    // Simple selection based on experience level
    if (context.experienceLevel === 'beginner' && templates.length > 2) {
      return templates[0]; // Usually simpler/more encouraging
    } else if (context.experienceLevel === 'advanced' && templates.length > 1) {
      return templates[templates.length - 1]; // Usually more advanced
    }
    
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  private determineDomainFromTrigger(trigger: string): string {
    const domainKeywords = {
      training: ['exercise', 'workout', 'training', 'strength', 'cardio'],
      nutrition: ['nutrition', 'diet', 'food', 'calories', 'protein', 'macros'],
      recovery: ['sleep', 'rest', 'recovery', 'stress', 'fatigue'],
      mindset: ['motivation', 'habit', 'goal', 'mindset', 'psychology'],
      supplements: ['supplement', 'vitamin', 'creatine', 'protein powder'],
      advanced: ['optimize', 'advanced', 'plateau', 'periodization']
    };
    
    const lowerTrigger = trigger.toLowerCase();
    
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => lowerTrigger.includes(keyword))) {
        return domain;
      }
    }
    
    return 'general';
  }
  
  private getCardTypesForFollowUpType(type: FollowUpType): EnhancedCardType[] {
    const cardTypeMap: Record<FollowUpType, EnhancedCardType[]> = {
      clarification: ['quick-tip', 'insight'],
      deepening: ['education', 'research'],
      application: ['action', 'plan'],
      troubleshooting: ['myth-buster', 'action'],
      expansion: ['education', 'insight'],
      validation: ['encouragement', 'progress'],
      motivation: ['encouragement', 'mindset'],
      measurement: ['progress', 'calculation'],
      optimization: ['insight', 'action'],
      education: ['education', 'research']
    };
    
    return cardTypeMap[type] || ['insight'];
  }
  
  private getDepthForFollowUpType(type: FollowUpType, context: FollowUpContext): 'quick' | 'standard' | 'comprehensive' {
    if (context.availableTime === 'minimal') return 'quick';
    if (context.availableTime === 'extensive') return 'comprehensive';
    
    const depthMap: Record<FollowUpType, 'quick' | 'standard' | 'comprehensive'> = {
      clarification: 'quick',
      validation: 'quick',
      motivation: 'standard',
      application: 'standard',
      measurement: 'standard',
      troubleshooting: 'standard',
      deepening: 'comprehensive',
      expansion: 'comprehensive',
      optimization: 'comprehensive',
      education: 'comprehensive'
    };
    
    return depthMap[type] || 'standard';
  }
  
  private getUserBenefitForType(type: FollowUpType): string {
    const benefitMap: Record<FollowUpType, string> = {
      clarification: 'Get personalized advice that fits your specific situation',
      deepening: 'Understand the underlying principles for better decision-making',
      application: 'Get practical steps you can implement immediately',
      troubleshooting: 'Overcome obstacles and avoid common pitfalls',
      expansion: 'Discover related strategies to accelerate your progress',
      validation: 'Confirm you\'re on the right track and build confidence',
      motivation: 'Maintain momentum and stay committed to your goals',
      measurement: 'Track progress effectively and make data-driven adjustments',
      optimization: 'Fine-tune your approach for maximum results',
      education: 'Build knowledge foundation for long-term success'
    };
    
    return benefitMap[type] || 'Continue your fitness journey with expert guidance';
  }
  
  private getPrerequisitesForType(type: FollowUpType, context: FollowUpContext): string[] | undefined {
    const prereqMap: Partial<Record<FollowUpType, string[]>> = {
      optimization: ['Basic understanding of current approach', 'Some experience with implementation'],
      education: ['Interest in learning underlying principles'],
      measurement: ['Ability to track metrics consistently'],
      troubleshooting: ['Identification of specific challenges']
    };
    
    return prereqMap[type];
  }
  
  private createGapBasedSuggestion(
    gap: string,
    mode: CoachingMode,
    context: FollowUpContext,
    id: string
  ): FollowUpSuggestion | null {
    const gapTypeMap: Record<string, FollowUpType> = {
      'individual variation not addressed': 'clarification',
      'goal-specific guidance missing': 'clarification',
      'specific recommendations needed': 'application',
      'medical considerations flagged': 'validation',
      'evidence limitations noted': 'education'
    };
    
    const type = gapTypeMap[gap] || 'clarification';
    const template = this.selectTemplateForContext(
      this.suggestionTemplates[mode][type],
      context
    );
    
    return {
      id,
      text: template,
      type,
      priority: 6,
      cardTypes: this.getCardTypesForFollowUpType(type),
      estimatedDepth: 'standard',
      domain: 'general',
      reasoning: `Addressing identified gap: ${gap}`,
      userBenefit: 'Get more complete and personalized guidance'
    };
  }
  
  private createGoalAlignedSuggestion(
    goals: string[],
    mode: CoachingMode,
    context: FollowUpContext,
    id: string
  ): FollowUpSuggestion | null {
    if (goals.length === 0) return null;
    
    const goalKeywords = goals.join(' ').toLowerCase();
    let type: FollowUpType = 'application';
    
    if (goalKeywords.includes('learn') || goalKeywords.includes('understand')) {
      type = 'education';
    } else if (goalKeywords.includes('track') || goalKeywords.includes('measure')) {
      type = 'measurement';
    } else if (goalKeywords.includes('optimize') || goalKeywords.includes('improve')) {
      type = 'optimization';
    }
    
    const template = this.selectTemplateForContext(
      this.suggestionTemplates[mode][type],
      context
    );
    
    return {
      id,
      text: `Based on your goal to ${goals[0].toLowerCase()}, ${template.toLowerCase()}`,
      type,
      priority: 7,
      cardTypes: this.getCardTypesForFollowUpType(type),
      estimatedDepth: this.getDepthForFollowUpType(type, context),
      domain: this.determineDomainFromTrigger(goals[0]),
      reasoning: `Aligned with user goal: ${goals[0]}`,
      userBenefit: 'Progress toward your specific fitness goals'
    };
  }
  
  private getDomainForModeType(mode: CoachingMode, type: FollowUpType): string {
    const modeDomainMap: Record<CoachingMode, string> = {
      supportive: 'mindset',
      'reality-check': 'general',
      socratic: 'education',
      analytical: 'advanced'
    };
    
    return modeDomainMap[mode] || 'general';
  }
  
  private matchesTimeConstraint(depth: 'quick' | 'standard' | 'comprehensive', constraint: string): boolean {
    const depthMap = { quick: 1, standard: 2, comprehensive: 3 };
    const constraintMap = { quick: 1, standard: 2, comprehensive: 3 };
    
    return depthMap[depth] <= constraintMap[constraint as keyof typeof constraintMap];
  }
  
  private areTopicsRelated(topic1: string, topic2: string): boolean {
    const keywords1 = topic1.toLowerCase().split(' ');
    const keywords2 = topic2.toLowerCase().split(' ');
    
    return keywords1.some(keyword => 
      keywords2.some(k2 => k2.includes(keyword) || keyword.includes(k2))
    );
  }
}

// Export singleton instance
export const followUpEngine = new FollowUpEngine();

/**
 * Utility functions for follow-up generation
 */

/**
 * Generate follow-up suggestions for a response
 */
export function generateFollowUpSuggestions(
  response: string,
  coachingMode: CoachingMode,
  context: FollowUpContext,
  criteria?: Partial<SuggestionCriteria>
): FollowUpSuggestion[] {
  const analysis = followUpEngine.analyzeResponse(response, coachingMode);
  const fullCriteria: SuggestionCriteria = {
    maxSuggestions: 4,
    minPriority: 5,
    preferredTypes: [],
    excludeTypes: [],
    ...criteria
  };
  
  const suggestions = followUpEngine.generateSuggestions(analysis, coachingMode, context, fullCriteria);
  return followUpEngine.personalizeSuggestions(suggestions, context);
}

/**
 * Analyze response for follow-up opportunities
 */
export function analyzeResponseForFollowUp(response: string, coachingMode: CoachingMode): ResponseAnalysis {
  return followUpEngine.analyzeResponse(response, coachingMode);
}

/**
 * Create follow-up context from user data
 */
export function createFollowUpContext(
  userData: any,
  interactionHistory: InteractionHistoryItem[] = []
): FollowUpContext {
  return {
    currentGoals: userData.goals || ['improve fitness'],
    experienceLevel: userData.experienceLevel || 'beginner',
    interactionHistory,
    strugglingAreas: userData.strugglingAreas || [],
    preferredLearningStyle: userData.learningStyle || 'conversational',
    availableTime: userData.availableTime || 'moderate',
    motivationLevel: userData.motivationLevel || 7,
    completedActions: [],
    pendingQuestions: []
  };
}

/**
 * Example usage:
 * 
 * // Analyze a coaching response
 * const analysis = analyzeResponseForFollowUp(coachingResponse, 'supportive');
 * 
 * // Generate follow-up suggestions
 * const suggestions = generateFollowUpSuggestions(
 *   coachingResponse,
 *   'reality-check',
 *   userContext,
 *   { maxSuggestions: 3, preferredTypes: ['application', 'troubleshooting'] }
 * );
 * 
 * // Use suggestions in UI
 * suggestions.forEach(suggestion => {
 *   console.log(`${suggestion.text} (Priority: ${suggestion.priority})`);
 * });
 */