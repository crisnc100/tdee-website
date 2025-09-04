/**
 * User Preferences Storage and Management
 * 
 * This module handles all user preference storage, validation, and synchronization
 * for the multi-AI TDEE system. It provides persistent storage for AI model
 * preferences, cost limits, quality settings, and intelligent defaults.
 */

// Note: useState is imported only for the hook function at the bottom
import { UserAIPreferences, AIModelId, DEFAULT_USER_PREFERENCES, AI_MODELS } from '@/types/ai';

/**
 * Storage keys for different preference categories
 */
export const STORAGE_KEYS = {
  AI_PREFERENCES: 'ai-model-preferences',
  USER_SETTINGS: 'user-settings',
  COST_TRACKING: 'ai-cost-tracking',
  MODEL_USAGE: 'ai-model-usage-stats'
} as const;

/**
 * Extended user preferences including UI and coaching settings
 */
export interface ExtendedUserPreferences extends UserAIPreferences {
  // UI Preferences
  showCostEstimates: boolean;
  showModelDetails: boolean;
  enableAdvancedSettings: boolean;
  
  // Coaching Preferences
  coachingTone: 'motivational' | 'technical' | 'balanced';
  coachingFrequency: 'minimal' | 'normal' | 'detailed';
  
  // Privacy & Data
  allowTelemetry: boolean;
  saveConversationHistory: boolean;
  
  // Quick Settings
  defaultModel?: AIModelId;
  quickSwitchModels: AIModelId[];
}

/**
 * Default extended preferences
 */
export const DEFAULT_EXTENDED_PREFERENCES: ExtendedUserPreferences = {
  ...DEFAULT_USER_PREFERENCES,
  showCostEstimates: true,
  showModelDetails: false,
  enableAdvancedSettings: false,
  coachingTone: 'balanced',
  coachingFrequency: 'normal',
  allowTelemetry: true,
  saveConversationHistory: false,
  quickSwitchModels: ['qwen2.5-7b-instruct', 'gpt-4o-mini', 'gemini-2.0-flash-exp']
};

/**
 * User preference validation schema
 */
interface PreferenceValidation {
  maxCostPerRequest?: { min: number; max: number };
  maxResponseTime?: { min: number; max: number };
  quickSwitchModels?: { maxCount: number };
}

const VALIDATION_RULES: PreferenceValidation = {
  maxCostPerRequest: { min: 0, max: 1.0 }, // Max $1 per request
  maxResponseTime: { min: 1, max: 60 }, // 1-60 seconds
  quickSwitchModels: { maxCount: 5 }
};

/**
 * Model usage statistics for analytics
 */
export interface ModelUsageStats {
  modelId: AIModelId;
  requestCount: number;
  successCount: number; // Successful requests
  totalCost: number;
  totalSavings: number; // Cost savings vs premium models
  avgResponseTime: number;
  successRate: number;
  lastUsed: string;
  userRating?: number; // 1-5 star rating from user
}

/**
 * Cost tracking data
 */
export interface CostTrackingData {
  dailySpend: number;
  weeklySpend: number;
  monthlySpend: number;
  totalRequests: number;
  lastReset: string;
  costAlerts: {
    dailyLimit: number;
    weeklyLimit: number;
    monthlyLimit: number;
  };
}

/**
 * User Preferences Manager Class
 */
export class UserPreferencesManager {
  private preferences: ExtendedUserPreferences;
  private modelUsageStats: Map<AIModelId, ModelUsageStats>;
  private costTracking: CostTrackingData;

  constructor() {
    this.preferences = this.loadPreferences();
    this.modelUsageStats = this.loadModelUsageStats();
    this.costTracking = this.loadCostTracking();
  }

  /**
   * Load preferences from localStorage with fallback to defaults
   */
  private loadPreferences(): ExtendedUserPreferences {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_EXTENDED_PREFERENCES };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AI_PREFERENCES);
      if (!stored) {
        return { ...DEFAULT_EXTENDED_PREFERENCES };
      }

      const parsed = JSON.parse(stored);
      
      // Merge with defaults to handle new preference fields
      const merged = {
        ...DEFAULT_EXTENDED_PREFERENCES,
        ...parsed
      };

      // Validate and fix any invalid values
      return this.validatePreferences(merged);
    } catch (error) {
      // console.warn('[UserPreferences] Failed to load preferences, using defaults:', error);
      return { ...DEFAULT_EXTENDED_PREFERENCES };
    }
  }

  /**
   * Load model usage statistics
   */
  private loadModelUsageStats(): Map<AIModelId, ModelUsageStats> {
    const stats = new Map<AIModelId, ModelUsageStats>();
    
    if (typeof window === 'undefined') {
      return stats;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MODEL_USAGE);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([modelId, stat]) => {
          stats.set(modelId as AIModelId, stat as ModelUsageStats);
        });
      }
    } catch (error) {
      // console.warn('[UserPreferences] Failed to load model stats:', error);
    }

    return stats;
  }

  /**
   * Load cost tracking data
   */
  private loadCostTracking(): CostTrackingData {
    const defaultTracking: CostTrackingData = {
      dailySpend: 0,
      weeklySpend: 0,
      monthlySpend: 0,
      totalRequests: 0,
      lastReset: new Date().toISOString(),
      costAlerts: {
        dailyLimit: 1.0,
        weeklyLimit: 5.0,
        monthlyLimit: 20.0
      }
    };

    if (typeof window === 'undefined') {
      return defaultTracking;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COST_TRACKING);
      return stored ? { ...defaultTracking, ...JSON.parse(stored) } : defaultTracking;
    } catch (error) {
      // console.warn('[UserPreferences] Failed to load cost tracking:', error);
      return defaultTracking;
    }
  }

  /**
   * Validate preferences and fix invalid values
   */
  private validatePreferences(prefs: ExtendedUserPreferences): ExtendedUserPreferences {
    const validated = { ...prefs };

    // Validate cost limit
    if (validated.maxCostPerRequest !== undefined) {
      const { min, max } = VALIDATION_RULES.maxCostPerRequest!;
      validated.maxCostPerRequest = Math.max(min, Math.min(max, validated.maxCostPerRequest));
    }

    // Validate response time
    if (validated.maxResponseTime !== undefined) {
      const { min, max } = VALIDATION_RULES.maxResponseTime!;
      validated.maxResponseTime = Math.max(min, Math.min(max, validated.maxResponseTime));
    }

    // Validate quick switch models
    if (validated.quickSwitchModels) {
      const validModels = validated.quickSwitchModels.filter(id => 
        Object.keys(AI_MODELS).includes(id) && AI_MODELS[id].isAvailable
      );
      validated.quickSwitchModels = validModels.slice(0, VALIDATION_RULES.quickSwitchModels!.maxCount);
    }

    // Validate default model
    if (validated.defaultModel && (!AI_MODELS[validated.defaultModel] || !AI_MODELS[validated.defaultModel].isAvailable)) {
      validated.defaultModel = undefined;
    }

    return validated;
  }

  /**
   * Get current user preferences
   */
  public getPreferences(): ExtendedUserPreferences {
    return { ...this.preferences };
  }

  /**
   * Update user preferences
   */
  public updatePreferences(updates: Partial<ExtendedUserPreferences>): ExtendedUserPreferences {
    const newPrefs = { ...this.preferences, ...updates };
    const validated = this.validatePreferences(newPrefs);
    
    this.preferences = validated;
    this.savePreferences();
    
    return { ...validated };
  }

  /**
   * Get AI preferences for the aiService
   */
  public getAIPreferences(): UserAIPreferences {
    const {
      preferFreeModels,
      maxCostPerRequest,
      maxResponseTime,
      qualityPreference,
      allowExperimental
    } = this.preferences;

    return {
      preferFreeModels,
      maxCostPerRequest,
      maxResponseTime,
      qualityPreference,
      allowExperimental
    };
  }

  /**
   * Get model recommendations based on user preferences
   */
  public getRecommendedModels(taskType?: string): AIModelId[] {
    const prefs = this.preferences;
    let models = Object.keys(AI_MODELS) as AIModelId[];

    // Filter by availability
    models = models.filter(id => AI_MODELS[id].isAvailable);

    // Apply preference filters
    if (prefs.preferFreeModels) {
      const freeModels = models.filter(id => AI_MODELS[id].pricing.isFree);
      if (freeModels.length > 0) {
        models = [...freeModels, ...models.filter(id => !AI_MODELS[id].pricing.isFree)];
      }
    }

    if (!prefs.allowExperimental) {
      models = models.filter(id => AI_MODELS[id].tier !== 'experimental');
    }

    // Sort by quality preference and usage stats
    models.sort((a, b) => {
      const modelA = AI_MODELS[a];
      const modelB = AI_MODELS[b];
      const statsA = this.modelUsageStats.get(a);
      const statsB = this.modelUsageStats.get(b);

      // Consider user ratings if available
      if (statsA?.userRating && statsB?.userRating) {
        return statsB.userRating - statsA.userRating;
      }

      // Fall back to model quality scores
      return modelB.performance.qualityScore - modelA.performance.qualityScore;
    });

    return models;
  }

  /**
   * Track model usage for analytics
   */
  public trackModelUsage(
    modelId: AIModelId, 
    responseTime: number, 
    cost: number, 
    success: boolean
  ): void {
    const existing = this.modelUsageStats.get(modelId) || {
      modelId,
      requestCount: 0,
      successCount: 0,
      totalCost: 0,
      totalSavings: 0,
      avgResponseTime: 0,
      successRate: 1,
      lastUsed: new Date().toISOString()
    };

    // Update statistics
    existing.requestCount++;
    if (success) existing.successCount++;
    existing.totalCost += cost;
    
    // Calculate cost savings (assuming Claude 3.5 Sonnet as premium baseline at $0.018/1k tokens)
    const premiumCost = 0.018;
    const currentModelCost = cost > 0 ? cost : 0;
    const potentialSavings = Math.max(0, premiumCost - currentModelCost);
    existing.totalSavings += potentialSavings;
    
    existing.avgResponseTime = (existing.avgResponseTime * (existing.requestCount - 1) + responseTime) / existing.requestCount;
    existing.successRate = existing.requestCount > 0 ? existing.successCount / existing.requestCount : 0;
    existing.lastUsed = new Date().toISOString();

    this.modelUsageStats.set(modelId, existing);
    this.saveModelUsageStats();

    // Update cost tracking
    this.updateCostTracking(cost);
  }

  /**
   * Update cost tracking
   */
  private updateCostTracking(cost: number): void {
    this.costTracking.dailySpend += cost;
    this.costTracking.weeklySpend += cost;
    this.costTracking.monthlySpend += cost;
    this.costTracking.totalRequests++;

    this.saveCostTracking();
  }

  /**
   * Get model usage statistics
   */
  public getModelUsageStats(): ModelUsageStats[] {
    return Array.from(this.modelUsageStats.values()).sort((a, b) => b.requestCount - a.requestCount);
  }

  /**
   * Get cost tracking data
   */
  public getCostTracking(): CostTrackingData {
    return { ...this.costTracking };
  }

  /**
   * Rate a model (1-5 stars)
   */
  public rateModel(modelId: AIModelId, rating: number): void {
    const stats = this.modelUsageStats.get(modelId);
    if (stats) {
      stats.userRating = Math.max(1, Math.min(5, rating));
      this.modelUsageStats.set(modelId, stats);
      this.saveModelUsageStats();
    }
  }

  /**
   * Reset preferences to defaults
   */
  public resetToDefaults(): ExtendedUserPreferences {
    this.preferences = { ...DEFAULT_EXTENDED_PREFERENCES };
    this.savePreferences();
    return { ...this.preferences };
  }

  /**
   * Export preferences for backup
   */
  public exportPreferences(): string {
    return JSON.stringify({
      preferences: this.preferences,
      modelUsageStats: Object.fromEntries(this.modelUsageStats),
      costTracking: this.costTracking,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import preferences from backup
   */
  public importPreferences(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.preferences) {
        this.preferences = this.validatePreferences(parsed.preferences);
        this.savePreferences();
      }

      if (parsed.modelUsageStats) {
        this.modelUsageStats.clear();
        Object.entries(parsed.modelUsageStats).forEach(([modelId, stats]) => {
          this.modelUsageStats.set(modelId as AIModelId, stats as ModelUsageStats);
        });
        this.saveModelUsageStats();
      }

      if (parsed.costTracking) {
        this.costTracking = { ...this.costTracking, ...parsed.costTracking };
        this.saveCostTracking();
      }

      return true;
    } catch (error) {
      // console.error('[UserPreferences] Failed to import preferences:', error);
      return false;
    }
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEYS.AI_PREFERENCES, JSON.stringify(this.preferences));
    } catch (error) {
      // console.error('[UserPreferences] Failed to save preferences:', error);
    }
  }

  /**
   * Save model usage statistics
   */
  private saveModelUsageStats(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = Object.fromEntries(this.modelUsageStats);
      localStorage.setItem(STORAGE_KEYS.MODEL_USAGE, JSON.stringify(data));
    } catch (error) {
      // console.error('[UserPreferences] Failed to save model stats:', error);
    }
  }

  /**
   * Save cost tracking data
   */
  private saveCostTracking(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEYS.COST_TRACKING, JSON.stringify(this.costTracking));
    } catch (error) {
      // console.error('[UserPreferences] Failed to save cost tracking:', error);
    }
  }
}

// Global instance
export const userPreferencesManager = new UserPreferencesManager();

/**
 * Note: useUserPreferences hook has been moved to @/hooks/useUserPreferences
 * for client-side usage. Import from there in React components.
 */