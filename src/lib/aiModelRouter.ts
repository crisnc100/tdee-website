import { AIModelId } from '@/types/ai';

export type QueryCategory = 'basic' | 'planning' | 'research';
export type AITier = 'fast' | 'precise' | 'research';

interface RouterConfig {
  dailyLimits: {
    precise: number;
    research: number;
  };
  fallbackEnabled: boolean;
}

interface QueryClassification {
  category: QueryCategory;
  suggestedTier: AITier;
  confidence: number;
  keywords: string[];
}

const QUERY_PATTERNS = {
  research: [
    'study', 'studies', 'research', 'evidence', 'scientific', 'paper', 'journal',
    'meta-analysis', 'clinical', 'trial', 'pubmed', 'ncbi', 'examine',
    'supplement', 'nootropic', 'peptide', 'compound', 'mechanism', 'pathway'
  ],
  planning: [
    'plan', 'program', 'routine', 'schedule', 'week', 'month', 'create',
    'design', 'build', 'develop', 'comprehensive', 'detailed', 'structured',
    'meal prep', 'workout split', 'periodization', 'progression', 'template'
  ],
  basic: [
    'what', 'how', 'why', 'when', 'quick', 'simple', 'basic', 'tell',
    'explain', 'should', 'can', 'is', 'are', 'do', 'does', 'tip', 'advice',
    'morning', 'today', 'check', 'progress', 'feeling', 'update'
  ]
};

const MODEL_MAPPING: Record<AITier, AIModelId> = {
  fast: 'qwen3-235b',
  precise: 'gpt-4o-mini',
  research: 'gemini-2.0-flash-exp'
};

export class AIModelRouter {
  private usageToday = {
    precise: 0,
    research: 0
  };
  
  private lastReset: Date;
  private config: RouterConfig;

  constructor(config?: Partial<RouterConfig>) {
    this.config = {
      dailyLimits: {
        precise: 100,
        research: 10
      },
      fallbackEnabled: true,
      ...config
    };
    
    this.lastReset = new Date();
    this.loadUsageFromStorage();
    this.checkDailyReset();
  }

  private loadUsageFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ai-model-usage');
      if (stored) {
        const data = JSON.parse(stored);
        this.usageToday = data.usage || this.usageToday;
        this.lastReset = new Date(data.lastReset || Date.now());
      }
    }
  }

  private saveUsageToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-model-usage', JSON.stringify({
        usage: this.usageToday,
        lastReset: this.lastReset.toISOString()
      }));
    }
  }

  private checkDailyReset() {
    const now = new Date();
    const lastResetDate = new Date(this.lastReset);
    
    // Reset at midnight
    if (now.getDate() !== lastResetDate.getDate() || 
        now.getMonth() !== lastResetDate.getMonth() || 
        now.getFullYear() !== lastResetDate.getFullYear()) {
      
      // Carry over up to 20 unused research queries
      const unusedResearch = Math.max(0, this.config.dailyLimits.research - this.usageToday.research);
      const carryOver = Math.min(20, unusedResearch);
      
      this.usageToday = {
        precise: 0,
        research: -carryOver // Negative means bonus queries
      };
      this.lastReset = now;
      this.saveUsageToStorage();
    }
  }

  classifyQuery(query: string): QueryClassification {
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(/\s+/);
    
    let researchScore = 0;
    let planningScore = 0;
    let basicScore = 0;
    const foundKeywords: string[] = [];
    
    // Check for keyword matches
    for (const word of words) {
      if (QUERY_PATTERNS.research.some(pattern => word.includes(pattern))) {
        researchScore += 2;
        foundKeywords.push(word);
      }
      if (QUERY_PATTERNS.planning.some(pattern => word.includes(pattern))) {
        planningScore += 1.5;
        foundKeywords.push(word);
      }
      if (QUERY_PATTERNS.basic.some(pattern => word.includes(pattern))) {
        basicScore += 1;
      }
    }
    
    // Query length heuristics
    if (query.length > 200) planningScore += 1;
    if (query.length < 50) basicScore += 1;
    
    // Question marks indicate basic queries
    if (query.includes('?')) basicScore += 0.5;
    
    // Determine category and tier
    let category: QueryCategory;
    let suggestedTier: AITier;
    let confidence: number;
    
    if (researchScore > planningScore && researchScore > basicScore) {
      category = 'research';
      suggestedTier = 'research';
      confidence = Math.min(0.95, researchScore / (researchScore + planningScore + basicScore));
    } else if (planningScore > basicScore) {
      category = 'planning';
      suggestedTier = 'precise';
      confidence = Math.min(0.9, planningScore / (researchScore + planningScore + basicScore));
    } else {
      category = 'basic';
      suggestedTier = 'fast';
      confidence = Math.min(0.85, basicScore / (researchScore + planningScore + basicScore));
    }
    
    return {
      category,
      suggestedTier,
      confidence,
      keywords: foundKeywords
    };
  }

  selectModel(
    query: string,
    options?: {
      forceMode?: AITier;
      context?: any;
    }
  ): {
    model: AIModelId;
    tier: AITier;
    reasoning: string;
    quotaUsed: boolean;
    quotaRemaining: { precise: number; research: number };
  } {
    this.checkDailyReset();
    
    // If mode is forced, try to use it
    if (options?.forceMode) {
      const canUse = this.checkQuota(options.forceMode);
      if (canUse) {
        this.incrementUsage(options.forceMode);
        return {
          model: MODEL_MAPPING[options.forceMode],
          tier: options.forceMode,
          reasoning: `User requested ${options.forceMode} mode`,
          quotaUsed: options.forceMode !== 'fast',
          quotaRemaining: this.getQuotaRemaining()
        };
      }
    }
    
    // Classify the query
    const classification = this.classifyQuery(query);
    let selectedTier = classification.suggestedTier;
    let reasoning = `Query classified as ${classification.category} (${Math.round(classification.confidence * 100)}% confidence)`;
    
    // Check quota and fallback if needed
    if (!this.checkQuota(selectedTier)) {
      if (selectedTier === 'research' && this.checkQuota('precise')) {
        selectedTier = 'precise';
        reasoning += '. Research quota exceeded, using precise mode';
      } else if (selectedTier === 'precise' && !this.checkQuota('precise')) {
        selectedTier = 'fast';
        reasoning += '. Precise quota exceeded, using fast mode';
      } else if (selectedTier === 'research') {
        selectedTier = 'fast';
        reasoning += '. All premium quotas exceeded, using fast mode';
      }
    }
    
    this.incrementUsage(selectedTier);
    
    return {
      model: MODEL_MAPPING[selectedTier],
      tier: selectedTier,
      reasoning,
      quotaUsed: selectedTier !== 'fast',
      quotaRemaining: this.getQuotaRemaining()
    };
  }

  private checkQuota(tier: AITier): boolean {
    if (tier === 'fast') return true;
    
    const limit = this.config.dailyLimits[tier as 'precise' | 'research'];
    const used = this.usageToday[tier as 'precise' | 'research'];
    
    return used < limit;
  }

  private incrementUsage(tier: AITier) {
    if (tier !== 'fast') {
      this.usageToday[tier as 'precise' | 'research']++;
      this.saveUsageToStorage();
    }
  }

  getQuotaRemaining() {
    return {
      precise: Math.max(0, this.config.dailyLimits.precise - this.usageToday.precise),
      research: Math.max(0, this.config.dailyLimits.research - this.usageToday.research)
    };
  }

  getUsageStats() {
    return {
      usedToday: { ...this.usageToday },
      limits: { ...this.config.dailyLimits },
      remaining: this.getQuotaRemaining(),
      lastReset: this.lastReset,
      nextReset: new Date(this.lastReset.getTime() + 24 * 60 * 60 * 1000)
    };
  }

  // Helper to get friendly message about quota status
  getQuotaMessage(tier: AITier): string | null {
    if (tier === 'fast') return null;
    
    const remaining = this.getQuotaRemaining();
    const tierRemaining = remaining[tier as 'precise' | 'research'];
    
    if (tierRemaining === 0) {
      return `${tier === 'research' ? 'Research' : 'Precise'} mode quota exceeded. Using fast mode to save your quota.`;
    } else if (tierRemaining <= 2) {
      return `Only ${tierRemaining} ${tier} queries remaining today.`;
    }
    
    return null;
  }
}