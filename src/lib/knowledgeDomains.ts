/**
 * Knowledge Domains System for Enhanced AI Fitness Coaching
 * 
 * This system provides comprehensive knowledge domain management for fitness coaching,
 * organizing information into specialized domains with cross-linking capabilities.
 * Each domain contains structured knowledge, prompt templates, and resource links.
 * 
 * Features:
 * - 6 comprehensive fitness domains (training, nutrition, recovery, mindset, supplements, advanced)
 * - Domain-specific prompt templates for AI coaching
 * - Topic recognition and cross-domain linking
 * - Contextual resource recommendations
 * - Evidence-based content with myth-busting frameworks
 */

import { EnhancedCardType } from '@/types/ai';

/**
 * Core knowledge domain interface
 */
export interface KnowledgeDomain {
  name: string;
  description: string;
  topics: string[];
  promptTemplates: Map<string, string>;
  commonQuestions: string[];
  resourceLinks: ResourceLink[];
  relatedDomains: string[];
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced';
  mythBusterTopics: string[];
  keyPrinciples: string[];
}

/**
 * Resource link with metadata
 */
export interface ResourceLink {
  title: string;
  url: string;
  type: 'research' | 'calculator' | 'guide' | 'video' | 'tool';
  credibility: 'high' | 'medium' | 'reference';
  description: string;
}

/**
 * Topic recognition pattern with scoring
 */
export interface TopicPattern {
  keywords: string[];
  phrases: RegExp[];
  weight: number;
  domain: string;
  cardTypes: EnhancedCardType[];
}

/**
 * Domain analysis result
 */
export interface DomainAnalysis {
  primaryDomain: string;
  secondaryDomains: string[];
  relevanceScores: Record<string, number>;
  suggestedPromptTemplate: string;
  crossDomainLinks: string[];
  recommendedCardTypes: EnhancedCardType[];
}

/**
 * Training Domain - Exercise, programming, and performance optimization
 */
const TRAINING_DOMAIN: KnowledgeDomain = {
  name: 'training',
  description: 'Exercise programming, strength training, cardio, and performance optimization',
  topics: [
    'strength-training', 'cardio', 'powerlifting', 'bodybuilding', 'calisthenics',
    'program-design', 'periodization', 'progressive-overload', 'exercise-selection',
    'form-technique', 'training-frequency', 'volume-intensity', 'rest-periods',
    'warm-up', 'mobility', 'flexibility', 'injury-prevention', 'plateau-breaking',
    'beginner-programs', 'intermediate-programs', 'advanced-programs'
  ],
  promptTemplates: new Map([
    ['program-design', `As a strength and conditioning expert, analyze the user's training goals and current fitness level. Create a evidence-based program that follows progressive overload principles and addresses their specific needs. Include exercise selection rationale, progression schemes, and periodization strategies.`],
    ['form-technique', `As a certified personal trainer, provide detailed form cues and technique analysis. Break down the movement biomechanics, common errors, and progressive corrections. Focus on safety, efficiency, and performance optimization.`],
    ['plateau-breaking', `As an experienced coach, identify potential causes of training plateaus and provide systematic solutions. Analyze training variables (volume, intensity, frequency, exercise selection) and recommend evidence-based modifications for continued progress.`],
    ['beginner-guidance', `As a patient, knowledgeable trainer working with beginners, provide clear, simple instructions that build confidence. Focus on fundamental movement patterns, realistic expectations, and sustainable habit formation. Emphasize safety and gradual progression.`]
  ]),
  commonQuestions: [
    'How do I build muscle effectively?',
    'What\'s the best training program for beginners?',
    'How often should I train each muscle group?',
    'Why am I not getting stronger?',
    'How do I fix my squat form?',
    'Should I do cardio or weights first?',
    'How much rest do I need between sets?',
    'What exercises are best for fat loss?'
  ],
  resourceLinks: [
    {
      title: 'Stronger By Science Training Principles',
      url: 'https://www.strongerbyscience.com',
      type: 'research',
      credibility: 'high',
      description: 'Evidence-based training methodology and program design principles'
    },
    {
      title: 'ExRx Exercise Directory',
      url: 'https://exrx.net',
      type: 'guide',
      credibility: 'high',
      description: 'Comprehensive exercise database with biomechanics and instructions'
    },
    {
      title: 'Starting Strength Program',
      url: 'https://startingstrength.com',
      type: 'guide',
      credibility: 'high',
      description: 'Proven beginner strength training methodology'
    }
  ],
  relatedDomains: ['nutrition', 'recovery', 'mindset'],
  expertiseLevel: 'intermediate',
  mythBusterTopics: [
    'spot-reduction-myth', 'cardio-kills-gains-myth', 'soreness-equals-effectiveness-myth',
    'women-bulking-myth', 'high-reps-for-toning-myth', 'fasted-cardio-myth'
  ],
  keyPrinciples: [
    'Progressive overload is the foundation of all training adaptations',
    'Consistency beats perfection in long-term results',
    'Recovery is when adaptations actually occur',
    'Form quality determines both safety and effectiveness',
    'Individual variation requires program customization'
  ]
};

/**
 * Nutrition Domain - Macronutrients, meal planning, and dietary strategies
 */
const NUTRITION_DOMAIN: KnowledgeDomain = {
  name: 'nutrition',
  description: 'Macronutrients, meal planning, dietary strategies, and nutritional timing',
  topics: [
    'macronutrients', 'micronutrients', 'calorie-balance', 'protein-requirements',
    'carbohydrate-timing', 'fat-intake', 'meal-timing', 'intermittent-fasting',
    'meal-prep', 'portion-control', 'food-quality', 'nutrient-density',
    'hydration', 'pre-workout-nutrition', 'post-workout-nutrition',
    'cutting-diet', 'bulking-diet', 'body-recomposition', 'dietary-adherence'
  ],
  promptTemplates: new Map([
    ['macro-calculation', `As a registered dietitian specializing in sports nutrition, calculate optimal macronutrient targets based on the user's goals, activity level, and body composition. Provide practical guidance for meeting these targets with real foods and explain the rationale behind each recommendation.`],
    ['meal-planning', `As a nutrition coach with expertise in meal planning, create a sustainable eating strategy that fits the user's lifestyle, preferences, and goals. Focus on nutrient density, meal timing, and practical implementation strategies.`],
    ['dietary-troubleshooting', `As an experienced nutrition coach, identify potential dietary issues affecting the user's progress. Analyze their eating patterns, food choices, and timing to provide evidence-based solutions for better results.`],
    ['nutrition-education', `As a nutrition educator, explain complex nutritional concepts in simple, actionable terms. Use analogies and practical examples to help users understand how nutrition supports their fitness goals.`]
  ]),
  commonQuestions: [
    'How much protein do I really need?',
    'What should I eat before/after workouts?',
    'Are carbs bad for fat loss?',
    'How do I calculate my macros?',
    'Should I try intermittent fasting?',
    'What\'s the best diet for muscle gain?',
    'How important is meal timing?',
    'Can I eat junk food and still see results?'
  ],
  resourceLinks: [
    {
      title: 'Examine.com Nutrition Database',
      url: 'https://examine.com',
      type: 'research',
      credibility: 'high',
      description: 'Unbiased nutrition and supplement research analysis'
    },
    {
      title: 'Precision Nutrition Macro Calculator',
      url: 'https://www.precisionnutrition.com',
      type: 'calculator',
      credibility: 'high',
      description: 'Evidence-based macronutrient calculation tool'
    },
    {
      title: 'USDA Food Database',
      url: 'https://fdc.nal.usda.gov',
      type: 'tool',
      credibility: 'high',
      description: 'Comprehensive nutrient database for food composition'
    }
  ],
  relatedDomains: ['training', 'recovery', 'supplements'],
  expertiseLevel: 'intermediate',
  mythBusterTopics: [
    'starvation-mode-myth', 'detox-myth', 'meal-frequency-myth',
    'carbs-at-night-myth', 'clean-eating-myth', 'negative-calorie-foods-myth'
  ],
  keyPrinciples: [
    'Calorie balance is the primary driver of weight change',
    'Protein intake is crucial for muscle preservation and growth',
    'Nutrient timing is less important than total daily intake',
    'Dietary adherence matters more than perfection',
    'Individual food tolerances and preferences must be considered'
  ]
};

/**
 * Recovery Domain - Sleep, stress management, and recovery protocols
 */
const RECOVERY_DOMAIN: KnowledgeDomain = {
  name: 'recovery',
  description: 'Sleep optimization, stress management, active recovery, and restoration protocols',
  topics: [
    'sleep-optimization', 'sleep-hygiene', 'stress-management', 'cortisol-regulation',
    'active-recovery', 'passive-recovery', 'massage-therapy', 'foam-rolling',
    'stretching', 'mobility-work', 'meditation', 'breathing-techniques',
    'recovery-monitoring', 'overtraining-prevention', 'deload-weeks',
    'hydration-recovery', 'temperature-therapy', 'light-therapy'
  ],
  promptTemplates: new Map([
    ['sleep-optimization', `As a sleep specialist working with athletes, analyze the user's sleep patterns and environment to optimize recovery. Provide evidence-based strategies for improving sleep quality, duration, and timing for enhanced performance and body composition.`],
    ['stress-management', `As a sports psychologist specializing in stress and recovery, help the user identify stress factors affecting their progress. Recommend practical stress management techniques and recovery protocols that support their fitness goals.`],
    ['recovery-protocols', `As a recovery specialist, design a comprehensive recovery strategy based on the user's training intensity and lifestyle factors. Include active recovery methods, monitoring techniques, and signs of overreaching.`],
    ['lifestyle-recovery', `As a lifestyle coach focusing on holistic health, help the user integrate recovery practices into their daily routine. Emphasize sustainable habits that support long-term health and fitness progress.`]
  ]),
  commonQuestions: [
    'How much sleep do I need for optimal recovery?',
    'Why am I always tired despite eating and training well?',
    'What are the best recovery methods for muscle soreness?',
    'How do I know if I\'m overtraining?',
    'Should I take rest days from exercise?',
    'How does stress affect my fitness progress?',
    'What\'s the difference between good and bad pain?',
    'How can I recover faster between workouts?'
  ],
  resourceLinks: [
    {
      title: 'Sleep Foundation Research',
      url: 'https://www.sleepfoundation.org',
      type: 'research',
      credibility: 'high',
      description: 'Comprehensive sleep research and optimization strategies'
    },
    {
      title: 'Headspace Meditation App',
      url: 'https://www.headspace.com',
      type: 'tool',
      credibility: 'medium',
      description: 'Guided meditation and stress reduction techniques'
    },
    {
      title: 'Recovery Guru Protocols',
      url: 'https://www.recoveryguru.com',
      type: 'guide',
      credibility: 'medium',
      description: 'Evidence-based recovery methods for athletes'
    }
  ],
  relatedDomains: ['training', 'nutrition', 'mindset'],
  expertiseLevel: 'beginner',
  mythBusterTopics: [
    'no-pain-no-gain-myth', 'more-is-better-myth', 'soreness-indicator-myth',
    'ice-bath-necessity-myth', 'stretching-injury-prevention-myth'
  ],
  keyPrinciples: [
    'Recovery is when adaptations actually occur, not during training',
    'Sleep quality affects hormone regulation and body composition',
    'Chronic stress undermines all fitness efforts',
    'Active recovery is often better than complete rest',
    'Individual recovery needs vary based on training and lifestyle factors'
  ]
};

/**
 * Mindset Domain - Psychology, motivation, and behavior change
 */
const MINDSET_DOMAIN: KnowledgeDomain = {
  name: 'mindset',
  description: 'Psychology, motivation, habit formation, and mental barriers to fitness success',
  topics: [
    'motivation-psychology', 'habit-formation', 'goal-setting', 'self-efficacy',
    'body-image', 'perfectionism', 'all-or-nothing-thinking', 'self-sabotage',
    'consistency-strategies', 'mindful-eating', 'exercise-motivation',
    'plateau-psychology', 'social-support', 'accountability', 'identity-change',
    'intrinsic-motivation', 'behavioral-change', 'cognitive-reframing'
  ],
  promptTemplates: new Map([
    ['motivation-coaching', `As a sports psychologist specializing in exercise motivation, help the user identify their intrinsic motivators and develop sustainable motivation strategies. Address psychological barriers and create systems for long-term adherence.`],
    ['habit-formation', `As a behavior change specialist, guide the user through evidence-based habit formation techniques. Focus on creating systems that make healthy behaviors automatic and sustainable over time.`],
    ['mindset-shift', `As a cognitive behavioral therapist working with fitness clients, help the user identify and reframe limiting beliefs about their capabilities. Develop healthier thought patterns that support their goals.`],
    ['goal-psychology', `As a goal-setting expert, help the user create meaningful, achievable goals using psychological principles. Address the emotional and mental aspects of goal pursuit and maintenance.`]
  ]),
  commonQuestions: [
    'How do I stay motivated when progress is slow?',
    'Why do I keep starting and stopping my fitness routine?',
    'How do I overcome perfectionist thinking?',
    'What do I do when I don\'t feel like working out?',
    'How can I change my relationship with food?',
    'Why do I self-sabotage my progress?',
    'How do I build lasting healthy habits?',
    'How do I deal with fitness plateaus mentally?'
  ],
  resourceLinks: [
    {
      title: 'Atomic Habits by James Clear',
      url: 'https://jamesclear.com/atomic-habits',
      type: 'guide',
      credibility: 'high',
      description: 'Evidence-based habit formation and behavior change strategies'
    },
    {
      title: 'Self-Determination Theory Research',
      url: 'https://selfdeterminationtheory.org',
      type: 'research',
      credibility: 'high',
      description: 'Research on intrinsic motivation and psychological needs'
    },
    {
      title: 'Mindful Eating Resources',
      url: 'https://www.mindful.org/mindful-eating',
      type: 'guide',
      credibility: 'medium',
      description: 'Strategies for developing a healthier relationship with food'
    }
  ],
  relatedDomains: ['training', 'nutrition', 'recovery'],
  expertiseLevel: 'beginner',
  mythBusterTopics: [
    'willpower-myth', 'motivation-requirement-myth', 'discipline-over-systems-myth',
    'one-size-fits-all-motivation-myth', 'quick-transformation-myth'
  ],
  keyPrinciples: [
    'Systems and environment design beat willpower and motivation',
    'Identity-based habits are more sustainable than outcome-based goals',
    'Progress, not perfection, drives long-term success',
    'Intrinsic motivation is more sustainable than extrinsic rewards',
    'Self-compassion improves adherence better than self-criticism'
  ]
};

/**
 * Supplements Domain - Evidence-based supplementation and safety
 */
const SUPPLEMENTS_DOMAIN: KnowledgeDomain = {
  name: 'supplements',
  description: 'Evidence-based supplementation, safety protocols, and cost-effectiveness analysis',
  topics: [
    'protein-powder', 'creatine', 'caffeine', 'beta-alanine', 'citrulline',
    'vitamin-d', 'omega-3', 'magnesium', 'zinc', 'multivitamins',
    'pre-workout', 'post-workout', 'fat-burners', 'testosterone-boosters',
    'supplement-timing', 'cost-effectiveness', 'quality-standards',
    'third-party-testing', 'interactions', 'safety-protocols'
  ],
  promptTemplates: new Map([
    ['supplement-analysis', `As a sports nutritionist with expertise in supplementation, analyze the user's current supplements and goals. Provide evidence-based recommendations focusing on safety, effectiveness, and cost-benefit analysis. Prioritize whole foods over supplements when appropriate.`],
    ['safety-evaluation', `As a clinical nutritionist specializing in supplement safety, evaluate potential supplement interactions and safety concerns based on the user's health status and medications. Emphasize proper dosing and quality sourcing.`],
    ['cost-effectiveness', `As a practical nutrition coach, help the user optimize their supplement budget by focusing on the most effective, research-backed options. Compare supplement costs to whole food alternatives where applicable.`],
    ['beginner-supplementation', `As a supplement educator working with beginners, provide clear, evidence-based guidance on which supplements are worth considering and which are unnecessary. Focus on foundational supplements with strong research backing.`]
  ]),
  commonQuestions: [
    'Do I really need protein powder?',
    'Is creatine safe and effective?',
    'What supplements are worth taking?',
    'Are pre-workout supplements necessary?',
    'How do I choose quality supplements?',
    'Can supplements replace a good diet?',
    'What\'s the best time to take supplements?',
    'Are expensive supplements worth it?'
  ],
  resourceLinks: [
    {
      title: 'Examine.com Supplement Database',
      url: 'https://examine.com/supplements',
      type: 'research',
      credibility: 'high',
      description: 'Comprehensive, unbiased supplement research analysis'
    },
    {
      title: 'NSF Certified for Sport',
      url: 'https://www.nsfsport.com',
      type: 'tool',
      credibility: 'high',
      description: 'Third-party testing and certification for supplement quality'
    },
    {
      title: 'Labdoor Supplement Testing',
      url: 'https://labdoor.com',
      type: 'tool',
      credibility: 'high',
      description: 'Independent supplement testing and quality rankings'
    }
  ],
  relatedDomains: ['nutrition', 'training', 'recovery'],
  expertiseLevel: 'advanced',
  mythBusterTopics: [
    'miracle-supplement-myth', 'more-expensive-better-myth', 'natural-equals-safe-myth',
    'proprietary-blend-myth', 'supplement-necessity-myth', 'timing-everything-myth'
  ],
  keyPrinciples: [
    'Supplements supplement, they don\'t replace a good diet',
    'Most people need fewer supplements than they think',
    'Quality and third-party testing matter more than marketing',
    'Evidence-based supplements focus on creatine, protein, and basic vitamins',
    'Cost-effectiveness should guide supplement decisions'
  ]
};

/**
 * Advanced Domain - Complex topics and cutting-edge research
 */
const ADVANCED_DOMAIN: KnowledgeDomain = {
  name: 'advanced',
  description: 'Advanced training methods, metabolic optimization, and cutting-edge research',
  topics: [
    'periodization', 'autoregulation', 'velocity-based-training', 'heart-rate-variability',
    'metabolic-flexibility', 'carb-cycling', 'refeed-days', 'diet-breaks',
    'body-recomposition', 'advanced-programming', 'biofeedback', 'genetic-factors',
    'hormonal-optimization', 'circadian-rhythms', 'nutrient-partitioning',
    'advanced-recovery', 'performance-analytics', 'biomarker-tracking'
  ],
  promptTemplates: new Map([
    ['advanced-programming', `As an elite strength coach with expertise in advanced training methods, design sophisticated programming using periodization, autoregulation, and biofeedback. Consider the user's training history and response patterns.`],
    ['metabolic-optimization', `As a metabolic researcher specializing in body composition, provide advanced strategies for optimizing metabolic flexibility, nutrient timing, and hormonal responses. Focus on evidence-based cutting-edge approaches.`],
    ['performance-analytics', `As a sports scientist specializing in performance tracking, help the user implement advanced monitoring techniques and interpret biomarkers for optimized training and recovery protocols.`],
    ['research-application', `As a researcher bridging the gap between science and practice, explain how cutting-edge research applies to the user's specific situation. Translate complex concepts into actionable strategies.`]
  ]),
  commonQuestions: [
    'How do I periodize my training effectively?',
    'What are advanced body recomposition strategies?',
    'How do I track and use biofeedback data?',
    'What role do genetics play in my results?',
    'How can I optimize my hormones naturally?',
    'What are the latest research findings on training?',
    'How do I break through advanced plateaus?',
    'What metrics should I track for optimization?'
  ],
  resourceLinks: [
    {
      title: 'Stronger By Science Research Review',
      url: 'https://www.strongerbyscience.com/research-review',
      type: 'research',
      credibility: 'high',
      description: 'Monthly analysis of cutting-edge exercise and nutrition research'
    },
    {
      title: 'Renaissance Periodization',
      url: 'https://renaissanceperiodization.com',
      type: 'research',
      credibility: 'high',
      description: 'Advanced programming and periodization principles'
    },
    {
      title: 'MASS Research Review',
      url: 'https://www.mass-lift.com',
      type: 'research',
      credibility: 'high',
      description: 'Monthly strength training and sports nutrition research analysis'
    }
  ],
  relatedDomains: ['training', 'nutrition', 'recovery', 'supplements'],
  expertiseLevel: 'advanced',
  mythBusterTopics: [
    'advanced-beginner-myth', 'complexity-equals-better-myth', 'genetic-limitation-myth',
    'perfect-program-myth', 'biomarker-obsession-myth'
  ],
  keyPrinciples: [
    'Advanced methods are only beneficial for advanced trainees',
    'Complexity should be earned through consistent execution of basics',
    'Individual response variation increases with training experience',
    'Advanced strategies require more precise implementation and monitoring',
    'Research findings must be contextualized for practical application'
  ]
};

/**
 * Domain registry for easy access and management
 */
export const KNOWLEDGE_DOMAINS: Record<string, KnowledgeDomain> = {
  training: TRAINING_DOMAIN,
  nutrition: NUTRITION_DOMAIN,
  recovery: RECOVERY_DOMAIN,
  mindset: MINDSET_DOMAIN,
  supplements: SUPPLEMENTS_DOMAIN,
  advanced: ADVANCED_DOMAIN
};

/**
 * Topic recognition patterns for intelligent domain classification
 */
const TOPIC_PATTERNS: TopicPattern[] = [
  // Training patterns
  {
    keywords: ['workout', 'exercise', 'training', 'gym', 'lift', 'strength', 'cardio', 'program'],
    phrases: [/\b(sets?|reps?|weights?|lifting|squats?|deadlifts?|bench press)\b/i],
    weight: 0.9,
    domain: 'training',
    cardTypes: ['plan', 'form-check', 'action']
  },
  {
    keywords: ['form', 'technique', 'posture', 'biomechanics'],
    phrases: [/\b(proper form|correct technique|how to do|movement pattern)\b/i],
    weight: 0.95,
    domain: 'training',
    cardTypes: ['form-check', 'education', 'insight']
  },
  
  // Nutrition patterns
  {
    keywords: ['food', 'diet', 'nutrition', 'eat', 'meal', 'calories', 'macros', 'protein'],
    phrases: [/\b(meal plan|macro calculation|what to eat|food choices)\b/i],
    weight: 0.85,
    domain: 'nutrition',
    cardTypes: ['nutrition', 'calculation', 'plan']
  },
  {
    keywords: ['tdee', 'bmr', 'deficit', 'surplus', 'maintenance'],
    phrases: [/\b(calorie needs|energy expenditure|metabolic rate)\b/i],
    weight: 0.95,
    domain: 'nutrition',
    cardTypes: ['calculation', 'insight', 'education']
  },
  
  // Recovery patterns
  {
    keywords: ['sleep', 'rest', 'recovery', 'tired', 'fatigue', 'sore', 'stress'],
    phrases: [/\b(sleep quality|recovery time|muscle soreness|overtraining)\b/i],
    weight: 0.8,
    domain: 'recovery',
    cardTypes: ['recovery', 'education', 'action']
  },
  
  // Mindset patterns
  {
    keywords: ['motivation', 'mindset', 'habit', 'psychology', 'mental', 'confidence'],
    phrases: [/\b(stay motivated|build habits|mental barrier|self-sabotage)\b/i],
    weight: 0.85,
    domain: 'mindset',
    cardTypes: ['mindset', 'encouragement', 'action']
  },
  
  // Supplements patterns
  {
    keywords: ['supplement', 'protein powder', 'creatine', 'vitamin', 'pills'],
    phrases: [/\b(pre-workout|post-workout|supplement stack|vitamin d)\b/i],
    weight: 0.9,
    domain: 'supplements',
    cardTypes: ['education', 'myth-buster', 'research']
  },
  
  // Advanced patterns
  {
    keywords: ['periodization', 'autoregulation', 'biofeedback', 'optimization', 'advanced'],
    phrases: [/\b(body recomposition|metabolic flexibility|performance analytics)\b/i],
    weight: 0.95,
    domain: 'advanced',
    cardTypes: ['research', 'insight', 'plan']
  }
];

/**
 * Knowledge Domain Analysis Engine
 */
export class KnowledgeDomainAnalyzer {
  /**
   * Analyze a query to determine primary and secondary domains
   */
  analyzeDomains(query: string): DomainAnalysis {
    const lowerQuery = query.toLowerCase();
    const domainScores: Record<string, number> = {};
    const suggestedCardTypes: Set<EnhancedCardType> = new Set();
    
    // Initialize domain scores
    Object.keys(KNOWLEDGE_DOMAINS).forEach(domain => {
      domainScores[domain] = 0;
    });
    
    // Analyze against topic patterns
    for (const pattern of TOPIC_PATTERNS) {
      let patternScore = 0;
      
      // Check keywords
      for (const keyword of pattern.keywords) {
        if (lowerQuery.includes(keyword)) {
          patternScore += pattern.weight * 0.6;
        }
      }
      
      // Check phrases (more specific, higher weight)
      for (const phrase of pattern.phrases) {
        if (phrase.test(lowerQuery)) {
          patternScore += pattern.weight * 1.0;
        }
      }
      
      // Apply pattern score to domain
      domainScores[pattern.domain] += patternScore;
      
      // Collect suggested card types
      if (patternScore > 0) {
        pattern.cardTypes.forEach(cardType => suggestedCardTypes.add(cardType));
      }
    }
    
    // Additional contextual scoring
    this.applyContextualScoring(lowerQuery, domainScores);
    
    // Determine primary and secondary domains
    const sortedDomains = Object.entries(domainScores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);
    
    const primaryDomain = sortedDomains[0]?.[0] || 'training';
    const secondaryDomains = sortedDomains.slice(1, 3).map(([domain]) => domain);
    
    // Get cross-domain links
    const crossDomainLinks = this.generateCrossDomainLinks(primaryDomain, secondaryDomains);
    
    // Select optimal prompt template
    const suggestedPromptTemplate = this.selectPromptTemplate(primaryDomain, lowerQuery);
    
    return {
      primaryDomain,
      secondaryDomains,
      relevanceScores: domainScores,
      suggestedPromptTemplate,
      crossDomainLinks,
      recommendedCardTypes: Array.from(suggestedCardTypes).slice(0, 4)
    };
  }
  
  /**
   * Apply contextual scoring based on query characteristics
   */
  private applyContextualScoring(query: string, domainScores: Record<string, number>): void {
    // Goal-oriented queries
    if (query.includes('lose weight') || query.includes('fat loss')) {
      domainScores.nutrition += 0.8;
      domainScores.training += 0.6;
    }
    
    if (query.includes('build muscle') || query.includes('gain muscle')) {
      domainScores.training += 0.9;
      domainScores.nutrition += 0.7;
    }
    
    // Problem-solving queries
    if (query.includes('not working') || query.includes('plateau') || query.includes('stuck')) {
      domainScores.advanced += 0.6;
      domainScores.mindset += 0.5;
    }
    
    // Beginner indicators
    if (query.includes('beginner') || query.includes('start') || query.includes('new to')) {
      domainScores.mindset += 0.4;
      domainScores.training += 0.3;
    }
    
    // Health concerns
    if (query.includes('health') || query.includes('medical') || query.includes('doctor')) {
      domainScores.recovery += 0.5;
      domainScores.supplements += 0.3;
    }
  }
  
  /**
   * Generate cross-domain links based on primary domain
   */
  private generateCrossDomainLinks(primaryDomain: string, secondaryDomains: string[]): string[] {
    const links: string[] = [];
    const domain = KNOWLEDGE_DOMAINS[primaryDomain];
    
    if (domain) {
      // Add direct related domains
      links.push(...domain.relatedDomains);
      
      // Add secondary domains that aren't already included
      secondaryDomains.forEach(secondary => {
        if (!links.includes(secondary) && secondary !== primaryDomain) {
          links.push(secondary);
        }
      });
    }
    
    return links.slice(0, 3); // Limit to top 3 cross-domain links
  }
  
  /**
   * Select the most appropriate prompt template for the query
   */
  private selectPromptTemplate(primaryDomain: string, query: string): string {
    const domain = KNOWLEDGE_DOMAINS[primaryDomain];
    if (!domain) return '';
    
    // Analyze query intent to select best template
    const firstTemplate = Array.from(domain.promptTemplates.values())[0] || '';
    
    if (query.includes('how to') || query.includes('technique')) {
      return domain.promptTemplates.get('form-technique') || 
             domain.promptTemplates.get('beginner-guidance') || 
             firstTemplate;
    }
    
    if (query.includes('program') || query.includes('plan')) {
      return domain.promptTemplates.get('program-design') || 
             domain.promptTemplates.get('meal-planning') || 
             firstTemplate;
    }
    
    if (query.includes('calculate') || query.includes('numbers')) {
      return domain.promptTemplates.get('macro-calculation') || 
             domain.promptTemplates.get('cost-effectiveness') ||
             firstTemplate;
    }
    
    if (query.includes('not working') || query.includes('plateau')) {
      return domain.promptTemplates.get('plateau-breaking') || 
             domain.promptTemplates.get('dietary-troubleshooting') ||
             firstTemplate;
    }
    
    // Default to first available template
    return firstTemplate;
  }
  
  /**
   * Get domain-specific resources for a query
   */
  getDomainResources(domainName: string, query?: string): ResourceLink[] {
    const domain = KNOWLEDGE_DOMAINS[domainName];
    if (!domain) return [];
    
    // If no specific query, return all resources
    if (!query) return domain.resourceLinks;
    
    // Filter resources based on query relevance
    const lowerQuery = query.toLowerCase();
    return domain.resourceLinks.filter(resource => {
      const relevantTerms = [
        ...resource.title.toLowerCase().split(' '),
        ...resource.description.toLowerCase().split(' ')
      ];
      
      return relevantTerms.some(term => lowerQuery.includes(term) || term.length > 6);
    });
  }
  
  /**
   * Check if a topic is a myth-busting opportunity
   */
  isMythBusterTopic(query: string, domainName: string): boolean {
    const domain = KNOWLEDGE_DOMAINS[domainName];
    if (!domain) return false;
    
    const lowerQuery = query.toLowerCase();
    return domain.mythBusterTopics.some(mythTopic => {
      const mythKeywords = mythTopic.split('-');
      return mythKeywords.some(keyword => lowerQuery.includes(keyword));
    });
  }
  
  /**
   * Get key principles for a domain
   */
  getDomainPrinciples(domainName: string): string[] {
    const domain = KNOWLEDGE_DOMAINS[domainName];
    return domain?.keyPrinciples || [];
  }
  
  /**
   * Get common questions for a domain (useful for follow-ups)
   */
  getDomainQuestions(domainName: string): string[] {
    const domain = KNOWLEDGE_DOMAINS[domainName];
    return domain?.commonQuestions || [];
  }
}

// Export singleton instance
export const knowledgeDomainAnalyzer = new KnowledgeDomainAnalyzer();

/**
 * Utility functions for easy domain access
 */

/**
 * Get domain information by name
 */
export function getDomain(domainName: string): KnowledgeDomain | null {
  return KNOWLEDGE_DOMAINS[domainName] || null;
}

/**
 * Get all available domain names
 */
export function getAllDomainNames(): string[] {
  return Object.keys(KNOWLEDGE_DOMAINS);
}

/**
 * Get domains by expertise level
 */
export function getDomainsByLevel(level: 'beginner' | 'intermediate' | 'advanced'): KnowledgeDomain[] {
  return Object.values(KNOWLEDGE_DOMAINS).filter(domain => domain.expertiseLevel === level);
}

/**
 * Search domains by topic
 */
export function searchDomainsByTopic(topic: string): KnowledgeDomain[] {
  const lowerTopic = topic.toLowerCase();
  return Object.values(KNOWLEDGE_DOMAINS).filter(domain =>
    domain.topics.some(domainTopic => domainTopic.includes(lowerTopic)) ||
    domain.name.includes(lowerTopic) ||
    domain.description.toLowerCase().includes(lowerTopic)
  );
}

/**
 * Example usage:
 * 
 * // Analyze a user query
 * const analysis = knowledgeDomainAnalyzer.analyzeDomains("How do I build muscle effectively?");
 * console.log(analysis.primaryDomain); // "training"
 * console.log(analysis.suggestedPromptTemplate); // Training-specific prompt
 * 
 * // Get domain resources
 * const resources = knowledgeDomainAnalyzer.getDomainResources("nutrition", "protein requirements");
 * 
 * // Check for myth-busting opportunities
 * const isMythTopic = knowledgeDomainAnalyzer.isMythBusterTopic("cardio kills gains", "training");
 */