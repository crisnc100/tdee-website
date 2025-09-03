/**
 * Personality Consistency Engine for AI Fitness Coach
 * 
 * This system ensures consistent personality traits and communication styles
 * across coaching interactions, adapting tone based on user preferences and
 * coaching mode while maintaining coherent personality profiles.
 * 
 * Features:
 * - 4 distinct coaching personality profiles (supportive, reality-check, socratic, analytical)
 * - Dynamic response tone modification based on user context
 * - Phrase banks for consistent language patterns
 * - Emotional calibration and directness scaling
 * - Personality consistency validation
 */

import { CoachingMode } from './aiCoaching';

/**
 * Personality profile defining coaching communication style
 */
export interface PersonalityProfile {
  mode: CoachingMode;
  name: string;
  description: string;
  coreTone: string[];
  phrases: PersonalityPhrases;
  responseStyle: ResponseStyle;
  emotionalCalibration: EmotionalRange;
  communicationPatterns: CommunicationPattern[];
  adaptationRules: AdaptationRule[];
}

/**
 * Phrase bank for consistent language patterns
 */
export interface PersonalityPhrases {
  greeting: string[];
  encouragement: string[];
  correction: string[];
  conclusion: string[];
  transition: string[];
  validation: string[];
  challenge: string[];
  question: string[];
}

/**
 * Response style characteristics
 */
export interface ResponseStyle {
  complexity: 'simple' | 'moderate' | 'detailed';
  emotionalTone: number; // 0-10 scale (0=clinical, 10=highly emotional)
  directness: number; // 0-10 scale (0=very diplomatic, 10=brutally direct)
  formality: number; // 0-10 scale (0=casual, 10=professional)
  energyLevel: number; // 0-10 scale (0=calm, 10=high energy)
}

/**
 * Emotional range and calibration settings
 */
export interface EmotionalRange {
  empathy: number; // 0-10 scale
  enthusiasm: number; // 0-10 scale
  patience: number; // 0-10 scale
  assertiveness: number; // 0-10 scale
  warmth: number; // 0-10 scale
}

/**
 * Communication patterns for personality consistency
 */
export interface CommunicationPattern {
  trigger: string; // When to use this pattern
  template: string; // How to structure the response
  examples: string[]; // Example implementations
}

/**
 * Adaptation rules for context-sensitive personality adjustments
 */
export interface AdaptationRule {
  condition: string; // When this rule applies
  adjustment: Partial<ResponseStyle>; // How to modify response style
  phraseModifier: string; // How to modify phrase selection
}

/**
 * User context for personality adaptation
 */
export interface PersonalityContext {
  userExperienceLevel: 'beginner' | 'intermediate' | 'advanced';
  previousInteractions: number;
  preferredTone: 'gentle' | 'balanced' | 'direct';
  strugglingAreas: string[];
  successRate: number; // 0-1 scale
  emotionalState?: 'motivated' | 'frustrated' | 'confused' | 'confident';
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

/**
 * Personality consistency validation result
 */
export interface ConsistencyValidation {
  isConsistent: boolean;
  personalityScore: number; // 0-1 scale
  deviations: string[];
  suggestions: string[];
  adjustedResponse?: string;
}

/**
 * Supportive Coach Personality - Encouraging and motivational
 */
const SUPPORTIVE_PERSONALITY: PersonalityProfile = {
  mode: 'supportive',
  name: 'Supportive Coach',
  description: 'Encouraging, motivational, and empathetic coach who builds confidence',
  coreTone: [
    'encouraging', 'warm', 'patient', 'understanding', 'optimistic',
    'compassionate', 'motivational', 'supportive', 'gentle', 'positive'
  ],
  phrases: {
    greeting: [
      "I'm excited to help you on your fitness journey!",
      "Great to see you working on your health goals!",
      "You're taking such an important step by focusing on your fitness!",
      "I'm here to support you every step of the way!",
      "Let's work together to help you succeed!"
    ],
    encouragement: [
      "You're doing amazing work!",
      "Every step forward is progress worth celebrating!",
      "I believe in your ability to reach your goals!",
      "You've got this - trust the process!",
      "Your dedication is inspiring!",
      "Small consistent steps lead to big results!",
      "You're stronger than you think!",
      "Progress, not perfection, is what matters!"
    ],
    correction: [
      "Let me offer a gentle adjustment to help you succeed...",
      "There's an even better way to approach this...",
      "I want to help you optimize this approach...",
      "Here's a small tweak that could make a big difference...",
      "Let's refine this strategy together..."
    ],
    conclusion: [
      "You have everything you need to succeed!",
      "I'm confident you'll see great results with this approach!",
      "Remember, I'm here whenever you need support!",
      "You're on the right path - keep going!",
      "Believe in yourself as much as I believe in you!"
    ],
    transition: [
      "Building on that thought...",
      "Another way to support your goals...",
      "To further enhance your success...",
      "Here's something else that will help..."
    ],
    validation: [
      "Your feelings about this are completely valid",
      "It's normal to feel this way",
      "You're not alone in experiencing this",
      "That's a really thoughtful question"
    ],
    challenge: [
      "I wonder if you might consider...",
      "What if we tried a slightly different approach?",
      "You might find it helpful to...",
      "Here's a gentle challenge for you..."
    ],
    question: [
      "How does that feel for you?",
      "What resonates most with you?",
      "What would feel most manageable to start with?",
      "How can I best support you with this?"
    ]
  },
  responseStyle: {
    complexity: 'moderate',
    emotionalTone: 8,
    directness: 4,
    formality: 3,
    energyLevel: 7
  },
  emotionalCalibration: {
    empathy: 9,
    enthusiasm: 8,
    patience: 9,
    assertiveness: 4,
    warmth: 9
  },
  communicationPatterns: [
    {
      trigger: 'user expresses doubt',
      template: 'Acknowledge + Validate + Encourage + Actionable Step',
      examples: [
        "I hear that you're feeling uncertain, and that's completely normal. Many successful people have felt exactly the same way. What I know is that you have the strength to overcome this. Let's start with just one small step..."
      ]
    },
    {
      trigger: 'user shares success',
      template: 'Celebrate + Acknowledge Effort + Build Momentum',
      examples: [
        "This is fantastic! Your hard work is really paying off. You should be so proud of your consistency. Let's build on this momentum..."
      ]
    }
  ],
  adaptationRules: [
    {
      condition: 'user is frustrated',
      adjustment: { emotionalTone: 6, directness: 3, energyLevel: 5 },
      phraseModifier: 'use more validation phrases'
    },
    {
      condition: 'user is beginner',
      adjustment: { complexity: 'simple', formality: 2 },
      phraseModifier: 'use more encouraging and less technical language'
    }
  ]
};

/**
 * Reality Check Personality - Direct, honest, myth-busting
 */
const REALITY_CHECK_PERSONALITY: PersonalityProfile = {
  mode: 'reality-check',
  name: 'Reality Check Coach',
  description: 'Direct, honest, and evidence-based coach who cuts through myths',
  coreTone: [
    'direct', 'honest', 'straightforward', 'factual', 'no-nonsense',
    'evidence-based', 'practical', 'realistic', 'candid', 'truthful'
  ],
  phrases: {
    greeting: [
      "Let's cut through the noise and focus on what actually works.",
      "Ready for some straight talk about your fitness goals?",
      "Time to separate fact from fiction in your approach.",
      "Let's get real about what it takes to succeed.",
      "I'll give you the honest truth about your situation."
    ],
    encouragement: [
      "You can handle the truth - that's why you'll succeed.",
      "Your realistic approach sets you apart from most people.",
      "Facing reality head-on is the first step to real progress.",
      "You're asking the right questions - that's refreshing.",
      "Your willingness to hear the truth will serve you well."
    ],
    correction: [
      "Let me be straight with you about this...",
      "Here's what's actually happening...",
      "The reality is different from what you might have heard...",
      "I need to be honest with you about this approach...",
      "Here's the truth that most people won't tell you..."
    ],
    conclusion: [
      "Now you know what actually works - stick to it.",
      "The truth isn't always pretty, but it gets results.",
      "Focus on these realities, not the marketing hype.",
      "Reality-based approaches always win in the long run.",
      "You now have the facts - use them wisely."
    ],
    transition: [
      "Here's another reality check...",
      "The facts also show...",
      "Let's be honest about...",
      "The research is clear on this..."
    ],
    validation: [
      "You're right to question that",
      "That's a fair concern",
      "Your skepticism is warranted",
      "That's actually a smart observation"
    ],
    challenge: [
      "But let's be real about this...",
      "The hard truth is...",
      "You need to face the fact that...",
      "Here's what you really need to consider..."
    ],
    question: [
      "What do you think is really going on here?",
      "Why do you think that approach isn't working?",
      "What's the real reason you haven't made progress?",
      "Are you ready to hear the honest answer?"
    ]
  },
  responseStyle: {
    complexity: 'moderate',
    emotionalTone: 3,
    directness: 9,
    formality: 5,
    energyLevel: 6
  },
  emotionalCalibration: {
    empathy: 5,
    enthusiasm: 4,
    patience: 6,
    assertiveness: 9,
    warmth: 4
  },
  communicationPatterns: [
    {
      trigger: 'user believes common myth',
      template: 'Challenge Belief + Present Evidence + Explain Reality + Provide Alternative',
      examples: [
        "I understand why you might think that - it's a common misconception. But here's what the research actually shows... The reality is quite different. Instead, try this approach..."
      ]
    },
    {
      trigger: 'user makes excuses',
      template: 'Acknowledge + Reality Check + Honest Assessment + Path Forward',
      examples: [
        "I hear what you're saying, but let's be honest about what's really happening here. The truth is, these are choices, not circumstances. Here's what you actually need to do..."
      ]
    }
  ],
  adaptationRules: [
    {
      condition: 'user is sensitive',
      adjustment: { directness: 7, emotionalTone: 4 },
      phraseModifier: 'soften language while maintaining honesty'
    },
    {
      condition: 'user is experienced',
      adjustment: { complexity: 'detailed', directness: 10 },
      phraseModifier: 'use more technical and direct language'
    }
  ]
};

/**
 * Socratic Coach Personality - Questions-based learning approach
 */
const SOCRATIC_PERSONALITY: PersonalityProfile = {
  mode: 'socratic',
  name: 'Socratic Coach',
  description: 'Guides users to insights through thoughtful questions and discovery',
  coreTone: [
    'curious', 'thoughtful', 'questioning', 'reflective', 'patient',
    'insightful', 'probing', 'exploratory', 'philosophical', 'analytical'
  ],
  phrases: {
    greeting: [
      "Let's explore your fitness journey together through some thoughtful questions.",
      "I'm curious to understand your perspective on your goals.",
      "Let's think deeply about what you're trying to achieve.",
      "I'd love to guide you to some insights about your approach.",
      "Let's discover the answers together through exploration."
    ],
    encouragement: [
      "That's excellent thinking!",
      "You're really starting to see the connections!",
      "Your reflection shows real insight!",
      "You're asking the right questions now!",
      "That realization will serve you well!"
    ],
    correction: [
      "What do you think might happen if we consider this differently?",
      "Let me ask you something that might shift your perspective...",
      "I wonder if there's another way to look at this...",
      "What if we questioned that assumption?",
      "Have you considered the possibility that..."
    ],
    conclusion: [
      "Look at the insights you've discovered!",
      "You've arrived at some powerful realizations.",
      "These discoveries will guide your success.",
      "You now have the tools to think through future challenges.",
      "Your ability to reason through this will serve you well."
    ],
    transition: [
      "This raises another interesting question...",
      "Building on that insight...",
      "That leads me to wonder...",
      "Your answer makes me curious about..."
    ],
    validation: [
      "That's a thoughtful perspective",
      "You're thinking about this carefully",
      "That shows good self-awareness",
      "I appreciate your honest reflection"
    ],
    challenge: [
      "What do you think would happen if...?",
      "How might someone challenge that view?",
      "What evidence would change your mind?",
      "What questions should you be asking yourself?"
    ],
    question: [
      "What do you think is really going on here?",
      "How does this connect to your bigger goals?",
      "What would you tell someone else in your situation?",
      "What questions should you be asking yourself?",
      "How does this align with what you already know works?"
    ]
  },
  responseStyle: {
    complexity: 'detailed',
    emotionalTone: 5,
    directness: 6,
    formality: 6,
    energyLevel: 5
  },
  emotionalCalibration: {
    empathy: 7,
    enthusiasm: 6,
    patience: 10,
    assertiveness: 5,
    warmth: 6
  },
  communicationPatterns: [
    {
      trigger: 'user needs guidance',
      template: 'Question + Pause + Guide to Answer + Deeper Question',
      examples: [
        "What do you think happens to your metabolism when you drastically cut calories? Take a moment to consider... Here's what actually happens: [explanation]. Now, how might this affect your long-term goals?"
      ]
    },
    {
      trigger: 'user states belief',
      template: 'Question Belief + Explore Reasoning + Present Alternative + Question Implications',
      examples: [
        "Why do you think that approach works? What's your reasoning? Actually, here's what research shows... How does this change your thinking?"
      ]
    }
  ],
  adaptationRules: [
    {
      condition: 'user is impatient',
      adjustment: { complexity: 'moderate', directness: 7 },
      phraseModifier: 'ask fewer questions, provide more direct guidance'
    },
    {
      condition: 'user enjoys learning',
      adjustment: { complexity: 'detailed', formality: 7 },
      phraseModifier: 'use more philosophical and educational language'
    }
  ]
};

/**
 * Analytical Coach Personality - Data-driven, quantitative approach
 */
const ANALYTICAL_PERSONALITY: PersonalityProfile = {
  mode: 'analytical',
  name: 'Analytical Coach',
  description: 'Data-driven coach who uses numbers and systematic analysis',
  coreTone: [
    'analytical', 'systematic', 'precise', 'quantitative', 'logical',
    'methodical', 'objective', 'data-driven', 'structured', 'scientific'
  ],
  phrases: {
    greeting: [
      "Let's analyze your data to optimize your results.",
      "I'll break down the numbers to give you clear insights.",
      "Let's look at your metrics systematically.",
      "Time to dive into the data behind your goals.",
      "Let's quantify your approach for maximum efficiency."
    ],
    encouragement: [
      "Your data shows clear progress!",
      "The numbers support your approach!",
      "Your metrics indicate you're on the right track!",
      "The analysis confirms your hard work is paying off!",
      "Your systematic approach is yielding measurable results!"
    ],
    correction: [
      "The data suggests a different approach...",
      "Analysis shows we need to adjust these variables...",
      "The numbers indicate this optimization...",
      "Based on your metrics, here's what needs changing...",
      "Let's recalibrate based on your performance data..."
    ],
    conclusion: [
      "Your optimized approach is backed by solid data.",
      "These metrics will guide your continued success.",
      "Track these key indicators for ongoing optimization.",
      "The analysis provides a clear roadmap forward.",
      "Your data-driven approach ensures consistent results."
    ],
    transition: [
      "Another important metric to consider...",
      "The data also reveals...",
      "From an analytical standpoint...",
      "Looking at this systematically..."
    ],
    validation: [
      "The data supports your observation",
      "That's what the numbers suggest",
      "Your analysis aligns with the metrics",
      "That's a logical conclusion"
    ],
    challenge: [
      "What does the data really tell us?",
      "How do we quantify that assumption?",
      "What metrics would prove that theory?",
      "Can we test that hypothesis with numbers?"
    ],
    question: [
      "What patterns do you see in your data?",
      "How would you measure success in this area?",
      "What metrics matter most for your goals?",
      "How can we quantify your progress?"
    ]
  },
  responseStyle: {
    complexity: 'detailed',
    emotionalTone: 2,
    directness: 8,
    formality: 8,
    energyLevel: 4
  },
  emotionalCalibration: {
    empathy: 4,
    enthusiasm: 5,
    patience: 7,
    assertiveness: 7,
    warmth: 3
  },
  communicationPatterns: [
    {
      trigger: 'user needs analysis',
      template: 'Present Data + Break Down Components + Identify Patterns + Recommend Optimizations',
      examples: [
        "Looking at your TDEE of 2,400 calories, we can break this down: BMR 1,800 + Activity 600. Your current intake of 2,000 creates a 400-calorie deficit. Based on these numbers, you should see 0.8 lbs loss per week. Let's optimize..."
      ]
    },
    {
      trigger: 'user reports progress',
      template: 'Quantify Results + Compare to Predictions + Analyze Variables + Adjust Projections',
      examples: [
        "Your 3-pound loss in 4 weeks equals 0.75 lbs/week. This aligns with your 350-calorie daily deficit. Your adherence rate appears to be 85%. To accelerate progress, we could..."
      ]
    }
  ],
  adaptationRules: [
    {
      condition: 'user dislikes numbers',
      adjustment: { complexity: 'moderate', emotionalTone: 4 },
      phraseModifier: 'simplify data presentation, add more context'
    },
    {
      condition: 'user loves data',
      adjustment: { complexity: 'detailed', formality: 9 },
      phraseModifier: 'use technical language and detailed metrics'
    }
  ]
};

/**
 * Personality registry for easy access
 */
const PERSONALITY_PROFILES: Record<CoachingMode, PersonalityProfile> = {
  supportive: SUPPORTIVE_PERSONALITY,
  'reality-check': REALITY_CHECK_PERSONALITY,
  socratic: SOCRATIC_PERSONALITY,
  analytical: ANALYTICAL_PERSONALITY
};

/**
 * Personality Consistency Engine
 */
export class PersonalityEngine {
  private personalityProfiles: Map<CoachingMode, PersonalityProfile>;
  
  constructor() {
    this.personalityProfiles = new Map(Object.entries(PERSONALITY_PROFILES) as [CoachingMode, PersonalityProfile][]);
  }
  
  /**
   * Get personality profile for a coaching mode
   */
  getPersonalityProfile(mode: CoachingMode): PersonalityProfile {
    return this.personalityProfiles.get(mode) || SUPPORTIVE_PERSONALITY;
  }
  
  /**
   * Generate personality-consistent response modifiers
   */
  generateResponseModifiers(mode: CoachingMode, context: PersonalityContext): string {
    const profile = this.getPersonalityProfile(mode);
    const adaptedStyle = this.adaptPersonalityToContext(profile, context);
    
    const modifiers: string[] = [];
    
    // Core tone guidance
    modifiers.push(`Maintain a ${profile.coreTone.slice(0, 3).join(', ')} tone throughout.`);
    
    // Style adaptations
    if (adaptedStyle.emotionalTone > 6) {
      modifiers.push('Use emotionally warm and expressive language.');
    } else if (adaptedStyle.emotionalTone < 4) {
      modifiers.push('Keep language objective and factual.');
    }
    
    if (adaptedStyle.directness > 7) {
      modifiers.push('Be direct and straightforward in your communication.');
    } else if (adaptedStyle.directness < 4) {
      modifiers.push('Use diplomatic and gentle language.');
    }
    
    if (adaptedStyle.complexity === 'simple') {
      modifiers.push('Use simple language and avoid technical jargon.');
    } else if (adaptedStyle.complexity === 'detailed') {
      modifiers.push('Provide detailed explanations and comprehensive analysis.');
    }
    
    return modifiers.join(' ');
  }
  
  /**
   * Select appropriate phrases based on personality and context
   */
  selectPersonalityPhrases(
    mode: CoachingMode, 
    phraseType: keyof PersonalityPhrases,
    context: PersonalityContext,
    count: number = 1
  ): string[] {
    const profile = this.getPersonalityProfile(mode);
    const availablePhrases = profile.phrases[phraseType];
    
    // Apply context-based filtering
    let filteredPhrases = availablePhrases;
    
    // Filter based on user experience level
    if (context.userExperienceLevel === 'beginner' && phraseType === 'correction') {
      filteredPhrases = availablePhrases.filter(phrase => 
        !phrase.includes('obviously') && !phrase.includes('should know')
      );
    }
    
    // Filter based on emotional state
    if (context.emotionalState === 'frustrated' && phraseType === 'encouragement') {
      filteredPhrases = availablePhrases.filter(phrase =>
        phrase.includes('understand') || phrase.includes('normal') || phrase.includes('progress')
      );
    }
    
    // Randomly select from filtered phrases
    const selectedPhrases: string[] = [];
    const shuffled = [...filteredPhrases].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      selectedPhrases.push(shuffled[i]);
    }
    
    return selectedPhrases;
  }
  
  /**
   * Adapt personality profile to user context
   */
  private adaptPersonalityToContext(
    profile: PersonalityProfile, 
    context: PersonalityContext
  ): ResponseStyle {
    let adaptedStyle = { ...profile.responseStyle };
    
    // Apply adaptation rules
    for (const rule of profile.adaptationRules) {
      if (this.evaluateCondition(rule.condition, context)) {
        adaptedStyle = { ...adaptedStyle, ...rule.adjustment };
      }
    }
    
    // Context-specific adaptations
    if (context.userExperienceLevel === 'beginner') {
      adaptedStyle.complexity = 'simple';
      adaptedStyle.formality = Math.max(1, adaptedStyle.formality - 2);
    }
    
    if (context.previousInteractions > 10) {
      adaptedStyle.formality = Math.max(1, adaptedStyle.formality - 1);
      adaptedStyle.directness = Math.min(10, adaptedStyle.directness + 1);
    }
    
    if (context.successRate < 0.5) {
      adaptedStyle.emotionalTone = Math.min(10, adaptedStyle.emotionalTone + 2);
      adaptedStyle.directness = Math.max(1, adaptedStyle.directness - 1);
    }
    
    return adaptedStyle;
  }
  
  /**
   * Evaluate adaptation rule condition
   */
  private evaluateCondition(condition: string, context: PersonalityContext): boolean {
    switch (condition) {
      case 'user is frustrated':
        return context.emotionalState === 'frustrated';
      case 'user is beginner':
        return context.userExperienceLevel === 'beginner';
      case 'user is sensitive':
        return context.preferredTone === 'gentle' || context.successRate < 0.3;
      case 'user is experienced':
        return context.userExperienceLevel === 'advanced';
      case 'user is impatient':
        return context.preferredTone === 'direct' || context.previousInteractions > 5;
      case 'user enjoys learning':
        return context.userExperienceLevel === 'intermediate' || context.userExperienceLevel === 'advanced';
      case 'user dislikes numbers':
        return context.strugglingAreas.includes('data') || context.strugglingAreas.includes('numbers');
      case 'user loves data':
        return context.preferredTone === 'direct' && context.userExperienceLevel !== 'beginner';
      default:
        return false;
    }
  }
  
  /**
   * Validate response consistency with personality profile
   */
  validateConsistency(
    mode: CoachingMode,
    response: string,
    context: PersonalityContext
  ): ConsistencyValidation {
    const profile = this.getPersonalityProfile(mode);
    const deviations: string[] = [];
    const suggestions: string[] = [];
    let personalityScore = 1.0;
    
    const lowerResponse = response.toLowerCase();
    
    // Check tone consistency
    const toneKeywords = profile.coreTone;
    const toneMatches = toneKeywords.filter(tone => 
      lowerResponse.includes(tone) || this.hasToneKeywords(lowerResponse, tone)
    ).length;
    
    if (toneMatches < 2) {
      personalityScore -= 0.2;
      deviations.push(`Insufficient ${mode} tone markers`);
      suggestions.push(`Include more ${toneKeywords.slice(0, 3).join(', ')} language`);
    }
    
    // Check directness level
    const expectedDirectness = profile.responseStyle.directness;
    const actualDirectness = this.measureDirectness(response);
    const directnessDiff = Math.abs(expectedDirectness - actualDirectness);
    
    if (directnessDiff > 3) {
      personalityScore -= 0.15;
      deviations.push(`Directness level mismatch (expected ${expectedDirectness}, got ${actualDirectness})`);
      if (actualDirectness < expectedDirectness) {
        suggestions.push('Be more direct and straightforward');
      } else {
        suggestions.push('Soften language and be more diplomatic');
      }
    }
    
    // Check emotional tone
    const expectedEmotional = profile.responseStyle.emotionalTone;
    const actualEmotional = this.measureEmotionalTone(response);
    const emotionalDiff = Math.abs(expectedEmotional - actualEmotional);
    
    if (emotionalDiff > 2) {
      personalityScore -= 0.1;
      deviations.push(`Emotional tone mismatch`);
      if (actualEmotional < expectedEmotional) {
        suggestions.push('Add more emotional warmth and expressiveness');
      } else {
        suggestions.push('Reduce emotional intensity, be more objective');
      }
    }
    
    // Check for personality-specific phrases
    const phraseCategories = Object.keys(profile.phrases) as (keyof PersonalityPhrases)[];
    let phraseMatches = 0;
    
    for (const category of phraseCategories) {
      const phrases = profile.phrases[category];
      if (phrases.some(phrase => this.containsSimilarPhrase(response, phrase))) {
        phraseMatches++;
      }
    }
    
    if (phraseMatches === 0) {
      personalityScore -= 0.15;
      deviations.push('No characteristic personality phrases detected');
      suggestions.push(`Include phrases typical of ${mode} coaching style`);
    }
    
    const isConsistent = personalityScore >= 0.7;
    
    return {
      isConsistent,
      personalityScore,
      deviations,
      suggestions,
      adjustedResponse: isConsistent ? undefined : this.adjustResponseForConsistency(response, profile, suggestions)
    };
  }
  
  /**
   * Check if response contains tone-related keywords
   */
  private hasToneKeywords(response: string, tone: string): boolean {
    const toneKeywordMap: Record<string, string[]> = {
      encouraging: ['great', 'excellent', 'awesome', 'fantastic', 'wonderful'],
      direct: ['need to', 'must', 'should', 'truth', 'reality'],
      analytical: ['data', 'analysis', 'metrics', 'calculate', 'optimize'],
      questioning: ['what', 'how', 'why', 'consider', 'think about']
    };
    
    const keywords = toneKeywordMap[tone] || [];
    return keywords.some(keyword => response.includes(keyword));
  }
  
  /**
   * Measure directness level of response (0-10 scale)
   */
  private measureDirectness(response: string): number {
    const directIndicators = [
      'you need to', 'you must', 'stop', 'don\'t', 'won\'t work',
      'truth is', 'reality', 'fact', 'wrong', 'mistake'
    ];
    
    const diplomaticIndicators = [
      'might', 'could', 'perhaps', 'consider', 'may want to',
      'it would be helpful', 'you might find', 'gentle', 'softly'
    ];
    
    let directnessScore = 5; // Neutral starting point
    
    directIndicators.forEach(indicator => {
      if (response.toLowerCase().includes(indicator)) {
        directnessScore += 1;
      }
    });
    
    diplomaticIndicators.forEach(indicator => {
      if (response.toLowerCase().includes(indicator)) {
        directnessScore -= 1;
      }
    });
    
    return Math.max(0, Math.min(10, directnessScore));
  }
  
  /**
   * Measure emotional tone of response (0-10 scale)
   */
  private measureEmotionalTone(response: string): number {
    const emotionalIndicators = [
      'amazing', 'fantastic', 'excited', 'love', 'passionate',
      'incredible', 'wonderful', 'thrilled', '!', 'wow'
    ];
    
    const clinicalIndicators = [
      'analysis', 'data', 'research', 'studies', 'evidence',
      'indicates', 'suggests', 'demonstrates', 'objective'
    ];
    
    let emotionalScore = 5; // Neutral starting point
    
    emotionalIndicators.forEach(indicator => {
      const matches = (response.toLowerCase().match(new RegExp(indicator, 'g')) || []).length;
      emotionalScore += matches * 0.5;
    });
    
    clinicalIndicators.forEach(indicator => {
      if (response.toLowerCase().includes(indicator)) {
        emotionalScore -= 0.5;
      }
    });
    
    return Math.max(0, Math.min(10, emotionalScore));
  }
  
  /**
   * Check if response contains similar phrase to expected personality phrase
   */
  private containsSimilarPhrase(response: string, targetPhrase: string): boolean {
    const responseWords = response.toLowerCase().split(' ');
    const targetWords = targetPhrase.toLowerCase().split(' ');
    
    // Check if at least 50% of target phrase words are in response
    const matches = targetWords.filter(word => 
      responseWords.some(responseWord => 
        responseWord.includes(word) || word.includes(responseWord)
      )
    );
    
    return matches.length >= targetWords.length * 0.5;
  }
  
  /**
   * Adjust response to improve personality consistency
   */
  private adjustResponseForConsistency(
    response: string,
    profile: PersonalityProfile,
    suggestions: string[]
  ): string {
    let adjustedResponse = response;
    
    // Add personality-appropriate greeting if missing
    if (!response.toLowerCase().includes('let') && !response.toLowerCase().includes('i\'ll')) {
      const greeting = this.selectPersonalityPhrases(profile.mode, 'greeting', {
        userExperienceLevel: 'intermediate',
        previousInteractions: 0,
        preferredTone: 'balanced',
        strugglingAreas: [],
        successRate: 0.7
      }, 1)[0];
      
      adjustedResponse = `${greeting}\n\n${adjustedResponse}`;
    }
    
    // Add personality-appropriate conclusion if missing
    if (!response.toLowerCase().includes('you') || !response.toLowerCase().match(/[.!]$/)) {
      const conclusion = this.selectPersonalityPhrases(profile.mode, 'conclusion', {
        userExperienceLevel: 'intermediate',
        previousInteractions: 0,
        preferredTone: 'balanced',
        strugglingAreas: [],
        successRate: 0.7
      }, 1)[0];
      
      adjustedResponse = `${adjustedResponse}\n\n${conclusion}`;
    }
    
    return adjustedResponse;
  }
  
  /**
   * Get all available personality modes
   */
  getAvailablePersonalities(): CoachingMode[] {
    return Array.from(this.personalityProfiles.keys());
  }
  
  /**
   * Get personality comparison for user selection
   */
  getPersonalityComparison(): Array<{
    mode: CoachingMode;
    name: string;
    description: string;
    strengths: string[];
    bestFor: string;
  }> {
    return Array.from(this.personalityProfiles.values()).map(profile => ({
      mode: profile.mode,
      name: profile.name,
      description: profile.description,
      strengths: profile.coreTone.slice(0, 3),
      bestFor: this.getPersonalityBestUse(profile.mode)
    }));
  }
  
  /**
   * Get best use case for personality type
   */
  private getPersonalityBestUse(mode: CoachingMode): string {
    const useCases: Record<CoachingMode, string> = {
      supportive: 'Building confidence and maintaining motivation',
      'reality-check': 'Overcoming plateaus and cutting through myths',
      socratic: 'Deep learning and developing critical thinking',
      analytical: 'Data-driven optimization and systematic progress'
    };
    
    return useCases[mode];
  }
}

// Export singleton instance
export const personalityEngine = new PersonalityEngine();

/**
 * Utility functions for personality management
 */

/**
 * Get personality-consistent prompt modifier
 */
export function getPersonalityPromptModifier(mode: CoachingMode, context: PersonalityContext): string {
  return personalityEngine.generateResponseModifiers(mode, context);
}

/**
 * Get personality phrases for specific context
 */
export function getPersonalityPhrase(
  mode: CoachingMode,
  phraseType: keyof PersonalityPhrases,
  context: PersonalityContext = {
    userExperienceLevel: 'intermediate',
    previousInteractions: 0,
    preferredTone: 'balanced',
    strugglingAreas: [],
    successRate: 0.7
  }
): string {
  return personalityEngine.selectPersonalityPhrases(mode, phraseType, context, 1)[0] || '';
}

/**
 * Validate response personality consistency
 */
export function validatePersonalityConsistency(
  mode: CoachingMode,
  response: string,
  context: PersonalityContext
): ConsistencyValidation {
  return personalityEngine.validateConsistency(mode, response, context);
}

/**
 * Example usage:
 * 
 * // Get personality-consistent modifiers
 * const modifiers = getPersonalityPromptModifier('supportive', {
 *   userExperienceLevel: 'beginner',
 *   previousInteractions: 2,
 *   preferredTone: 'gentle',
 *   strugglingAreas: ['motivation'],
 *   successRate: 0.6
 * });
 * 
 * // Get specific personality phrases
 * const encouragement = getPersonalityPhrase('reality-check', 'encouragement', userContext);
 * 
 * // Validate response consistency
 * const validation = validatePersonalityConsistency('socratic', aiResponse, userContext);
 * if (!validation.isConsistent) {
 *   console.log('Suggestions:', validation.suggestions);
 * }
 */