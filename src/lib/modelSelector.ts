/**
 * Smart Model Selection Service for Multi-AI System
 * 
 * This service implements intelligent model routing with cost optimization,
 * performance balancing, and user preference integration for Phase 4 of
 * the Multi-AI TDEE Implementation Plan.
 * 
 * Features:
 * - Context-aware model selection
 * - Cost-performance optimization (90%+ cost reduction)
 * - User preference integration
 * - Fallback model hierarchy
 * - Load balancing logic
 * - Real-time model health monitoring
 * - Smart caching strategies
 */

import {
  AIModelId,
  AITaskType,
  UserAIPreferences,
  ModelRoutingDecision,
  AI_MODELS,
  TASK_MODEL_RECOMMENDATIONS,
  DEFAULT_USER_PREFERENCES,
  ModelHealthStatus
} from '@/types/ai';

/**
 * Advanced selection criteria for model routing
 */
export interface ModelSelectionCriteria {
  /** Primary task type */
  taskType: AITaskType;
  /** User preferences */
  userPreferences?: UserAIPreferences;
  /** Request complexity (0-1) */
  complexity?: number;
  /** Required response quality (0-1) */
  requiredQuality?: number;
  /** Maximum acceptable cost in USD */
  maxCost?: number;
  /** Maximum acceptable response time in seconds */
  maxResponseTime?: number;
  /** Preferred model if specified by user */
  preferredModel?: AIModelId;
  /** Context about the request */
  context?: {
    isRetry?: boolean;
    previousModel?: AIModelId;
    urgency?: 'low' | 'medium' | 'high';
    userType?: 'new' | 'returning' | 'premium';
  };
}

/**
 * Enhanced routing decision with optimization insights
 */
export interface EnhancedModelRoutingDecision extends ModelRoutingDecision {
  /** Optimization score (0-1) */
  optimizationScore: number;
  /** Cost savings compared to premium model */
  costSavings: number;
  /** Performance trade-offs */
  tradeOffs: string[];
  /** Confidence in selection */
  confidence: number;
  /** Alternative models with scores */
  alternativesWithScores: Array<{
    modelId: AIModelId;
    score: number;
    reason: string;
  }>;
}

/**
 * Model performance metrics for optimization
 */
interface ModelPerformanceMetrics {
  qualityScore: number;
  speedScore: number;
  costScore: number;
  reliabilityScore: number;
  overallScore: number;
}

/**
 * Smart Model Selection Service
 */
export class SmartModelSelector {
  private static instance: SmartModelSelector;
  private modelHealthCache: Map<AIModelId, ModelHealthStatus> = new Map();
  private performanceHistory: Map<AIModelId, ModelPerformanceMetrics> = new Map();
  private lastHealthUpdate: number = 0;
  private readonly HEALTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): SmartModelSelector {
    if (!SmartModelSelector.instance) {
      SmartModelSelector.instance = new SmartModelSelector();
    }
    return SmartModelSelector.instance;
  }

  /**
   * Select optimal model based on comprehensive criteria
   */
  public selectOptimalModel(criteria: ModelSelectionCriteria): EnhancedModelRoutingDecision {
    console.log(`[ModelSelector] Selecting model for ${criteria.taskType} task`);
    
    const userPrefs = { ...DEFAULT_USER_PREFERENCES, ...criteria.userPreferences };
    
    // Get candidate models based on task type and user preferences
    const candidateModels = this.getCandidateModels(criteria, userPrefs);
    
    // Score each candidate model
    const scoredModels = candidateModels.map(modelId => ({
      modelId,
      score: this.calculateModelScore(modelId, criteria, userPrefs),
      metrics: this.getModelMetrics(modelId, criteria)
    }));

    // Sort by score (highest first)
    scoredModels.sort((a, b) => b.score - a.score);

    const selectedModel = scoredModels[0];
    if (!selectedModel) {
      throw new Error('No suitable model found for criteria');
    }

    // Calculate optimization insights
    const optimizationInsights = this.calculateOptimizationInsights(
      selectedModel.modelId,
      scoredModels,
      criteria
    );

    console.log(`[ModelSelector] Selected ${selectedModel.modelId} with score ${selectedModel.score.toFixed(3)}`);

    return {
      selectedModel: selectedModel.modelId,
      reason: this.getSelectionReason(selectedModel.modelId, criteria, userPrefs),
      alternatives: scoredModels.slice(1, 4).map(m => m.modelId),
      estimatedCost: this.estimateRequestCost(selectedModel.modelId, criteria),
      estimatedTime: AI_MODELS[selectedModel.modelId].performance.avgResponseTime,
      optimizationScore: optimizationInsights.optimizationScore,
      costSavings: optimizationInsights.costSavings,
      tradeOffs: optimizationInsights.tradeOffs,
      confidence: selectedModel.score,
      alternativesWithScores: scoredModels.slice(1, 4).map(m => ({
        modelId: m.modelId,
        score: m.score,
        reason: this.getAlternativeReason(m.modelId, criteria)
      }))
    };
  }

  /**
   * Get candidate models based on task type and filters
   */
  private getCandidateModels(
    criteria: ModelSelectionCriteria,
    userPrefs: UserAIPreferences
  ): AIModelId[] {
    // Start with task-specific recommendations
    let candidates = criteria.preferredModel 
      ? [criteria.preferredModel, ...TASK_MODEL_RECOMMENDATIONS[criteria.taskType]]
      : [...TASK_MODEL_RECOMMENDATIONS[criteria.taskType]];

    // Remove duplicates
    candidates = [...new Set(candidates)];

    // Apply user preference filters
    candidates = candidates.filter(modelId => {
      const model = AI_MODELS[modelId];
      
      // Check availability
      if (!model.isAvailable) return false;
      
      // Check health status
      const health = this.getModelHealth(modelId);
      if (health && !health.isHealthy) return false;
      
      // Check experimental model preference
      if (!userPrefs.allowExperimental && model.tier === 'experimental') {
        return false;
      }
      
      // Check cost constraints
      const estimatedCost = this.estimateRequestCost(modelId, criteria);
      if (userPrefs.maxCostPerRequest && estimatedCost > userPrefs.maxCostPerRequest) {
        return false;
      }
      
      // Check response time constraints
      if (userPrefs.maxResponseTime && model.performance.avgResponseTime > userPrefs.maxResponseTime) {
        return false;
      }
      
      return true;
    });

    // If free models are preferred, prioritize them
    if (userPrefs.preferFreeModels) {
      const freeModels = candidates.filter(id => AI_MODELS[id].pricing.isFree);
      const paidModels = candidates.filter(id => !AI_MODELS[id].pricing.isFree);
      candidates = [...freeModels, ...paidModels];
    }

    return candidates;
  }

  /**
   * Calculate comprehensive model score
   */
  private calculateModelScore(
    modelId: AIModelId,
    criteria: ModelSelectionCriteria,
    userPrefs: UserAIPreferences
  ): number {
    const model = AI_MODELS[modelId];
    const metrics = this.getModelMetrics(modelId, criteria);
    
    let score = 0;
    let totalWeight = 0;

    // Quality weight (30-50% depending on preference)
    const qualityWeight = userPrefs.qualityPreference === 'high-quality' ? 0.5 : 
                         userPrefs.qualityPreference === 'balanced' ? 0.35 : 0.3;
    score += metrics.qualityScore * qualityWeight;
    totalWeight += qualityWeight;

    // Cost weight (20-40% depending on preference)
    const costWeight = userPrefs.preferFreeModels ? 0.4 : 0.25;
    score += metrics.costScore * costWeight;
    totalWeight += costWeight;

    // Speed weight (15-30% depending on preference)
    const speedWeight = userPrefs.qualityPreference === 'fast' ? 0.3 : 0.2;
    score += metrics.speedScore * speedWeight;
    totalWeight += speedWeight;

    // Reliability weight (15%)
    const reliabilityWeight = 0.15;
    score += metrics.reliabilityScore * reliabilityWeight;
    totalWeight += reliabilityWeight;

    // Context-specific adjustments
    if (criteria.context?.isRetry && criteria.context.previousModel === modelId) {
      score *= 0.5; // Penalize retrying same model
    }

    if (criteria.context?.urgency === 'high') {
      // Prioritize fast, reliable models for urgent requests
      score = score * 0.7 + (metrics.speedScore * 0.2) + (metrics.reliabilityScore * 0.1);
    }

    // Task-specific bonus
    const taskOptimalModels = TASK_MODEL_RECOMMENDATIONS[criteria.taskType];
    const taskRank = taskOptimalModels.indexOf(modelId);
    if (taskRank >= 0) {
      const bonus = (taskOptimalModels.length - taskRank) / taskOptimalModels.length * 0.1;
      score += bonus;
    }

    // Preferred model bonus
    if (criteria.preferredModel === modelId) {
      score += 0.1;
    }

    return Math.min(1.0, score / totalWeight);
  }

  /**
   * Get model performance metrics
   */
  private getModelMetrics(modelId: AIModelId, criteria: ModelSelectionCriteria): ModelPerformanceMetrics {
    // Check cache first
    const cached = this.performanceHistory.get(modelId);
    if (cached) return cached;

    const model = AI_MODELS[modelId];
    
    // Calculate quality score based on model tier and task fit
    const qualityScore = this.calculateQualityScore(model, criteria.taskType);
    
    // Calculate speed score (inverse of response time)
    const maxResponseTime = 10; // seconds
    const speedScore = Math.max(0, 1 - (model.performance.avgResponseTime / maxResponseTime));
    
    // Calculate cost score (higher score for lower cost)
    const costScore = model.pricing.isFree ? 1.0 : this.calculateCostScore(model);
    
    // Use reliability score from model definition
    const reliabilityScore = model.performance.reliabilityScore;
    
    // Calculate overall score
    const overallScore = (qualityScore + speedScore + costScore + reliabilityScore) / 4;

    const metrics: ModelPerformanceMetrics = {
      qualityScore,
      speedScore,
      costScore,
      reliabilityScore,
      overallScore
    };

    // Cache metrics
    this.performanceHistory.set(modelId, metrics);
    
    return metrics;
  }

  /**
   * Calculate quality score for model-task combination
   */
  private calculateQualityScore(model: any, taskType: AITaskType): number {
    let baseScore = model.performance.qualityScore;
    
    // Task-specific adjustments
    const taskOptimalModels = TASK_MODEL_RECOMMENDATIONS[taskType];
    const taskRank = taskOptimalModels.indexOf(model.id);
    
    if (taskRank >= 0) {
      // Bonus for being in top recommendations
      const bonus = (taskOptimalModels.length - taskRank) / taskOptimalModels.length * 0.1;
      baseScore += bonus;
    }
    
    // Tier-based adjustments
    switch (model.tier) {
      case 'premium':
        baseScore += 0.05;
        break;
      case 'experimental':
        baseScore -= 0.1; // Penalty for experimental status
        break;
    }
    
    return Math.min(1.0, baseScore);
  }

  /**
   * Calculate cost score (higher is better/cheaper)
   */
  private calculateCostScore(model: any): number {
    if (model.pricing.isFree) return 1.0;
    
    // Compare to most expensive model (Claude 3.5 Sonnet)
    const maxCost = AI_MODELS['claude-3.5-sonnet'].pricing.inputCostPer1M + 
                   AI_MODELS['claude-3.5-sonnet'].pricing.outputCostPer1M;
    const modelCost = model.pricing.inputCostPer1M + model.pricing.outputCostPer1M;
    
    return Math.max(0.1, 1 - (modelCost / maxCost));
  }

  /**
   * Estimate request cost based on criteria
   */
  private estimateRequestCost(modelId: AIModelId, criteria: ModelSelectionCriteria): number {
    const model = AI_MODELS[modelId];
    if (model.pricing.isFree) return 0;

    // Base estimation on task complexity
    const baseTokens = criteria.complexity ? Math.round(criteria.complexity * 2000) : 1000;
    const inputTokens = baseTokens * 0.7; // Estimate 70% input
    const outputTokens = baseTokens * 0.3; // Estimate 30% output

    const inputCost = (inputTokens / 1_000_000) * model.pricing.inputCostPer1M;
    const outputCost = (outputTokens / 1_000_000) * model.pricing.outputCostPer1M;

    return inputCost + outputCost;
  }

  /**
   * Calculate optimization insights
   */
  private calculateOptimizationInsights(
    selectedModel: AIModelId,
    scoredModels: Array<{ modelId: AIModelId; score: number }>,
    criteria: ModelSelectionCriteria
  ) {
    const premiumModel = 'claude-3.5-sonnet';
    const selectedCost = this.estimateRequestCost(selectedModel, criteria);
    const premiumCost = this.estimateRequestCost(premiumModel, criteria);
    
    const costSavings = Math.max(0, premiumCost - selectedCost);
    const optimizationScore = scoredModels[0]?.score || 0;
    
    const tradeOffs: string[] = [];
    const selectedModelData = AI_MODELS[selectedModel];
    const premiumModelData = AI_MODELS[premiumModel];
    
    if (selectedModelData.performance.qualityScore < premiumModelData.performance.qualityScore) {
      const qualityDiff = ((premiumModelData.performance.qualityScore - selectedModelData.performance.qualityScore) * 100).toFixed(0);
      tradeOffs.push(`${qualityDiff}% lower quality score for cost savings`);
    }
    
    if (selectedModelData.performance.avgResponseTime > premiumModelData.performance.avgResponseTime) {
      const timeDiff = (selectedModelData.performance.avgResponseTime - premiumModelData.performance.avgResponseTime).toFixed(1);
      tradeOffs.push(`${timeDiff}s slower response time`);
    }
    
    if (selectedModelData.tier === 'experimental') {
      tradeOffs.push('Using experimental model - may have stability issues');
    }

    return {
      optimizationScore,
      costSavings,
      tradeOffs
    };
  }

  /**
   * Get selection reason for logging
   */
  private getSelectionReason(
    modelId: AIModelId,
    criteria: ModelSelectionCriteria,
    userPrefs: UserAIPreferences
  ): string {
    const model = AI_MODELS[modelId];
    
    if (criteria.preferredModel === modelId) {
      return `User specified model preference`;
    }
    
    if (model.pricing.isFree && userPrefs.preferFreeModels) {
      return `Free model selected for cost optimization`;
    }
    
    const taskOptimalModels = TASK_MODEL_RECOMMENDATIONS[criteria.taskType];
    if (taskOptimalModels[0] === modelId) {
      return `Optimal model for ${criteria.taskType} tasks`;
    }
    
    if (userPrefs.qualityPreference === 'fast' && model.performance.avgResponseTime < 3) {
      return `Fast model selected for speed preference`;
    }
    
    if (userPrefs.qualityPreference === 'high-quality' && model.performance.qualityScore > 0.9) {
      return `High-quality model selected for quality preference`;
    }
    
    return `Best available model based on optimization score`;
  }

  /**
   * Get alternative model reason
   */
  private getAlternativeReason(modelId: AIModelId, criteria: ModelSelectionCriteria): string {
    const model = AI_MODELS[modelId];
    
    if (model.pricing.isFree) {
      return 'Cost-effective alternative';
    }
    
    if (model.performance.avgResponseTime < 2) {
      return 'Faster response alternative';
    }
    
    if (model.performance.qualityScore > 0.9) {
      return 'Higher quality alternative';
    }
    
    return 'Alternative option';
  }

  /**
   * Get model health status with caching
   */
  private getModelHealth(modelId: AIModelId): ModelHealthStatus | null {
    const now = Date.now();
    
    // Return cached health if fresh
    if (now - this.lastHealthUpdate < this.HEALTH_CACHE_TTL) {
      return this.modelHealthCache.get(modelId) || null;
    }
    
    // Health would be updated by the AI service
    // For now, assume healthy if model is available
    const model = AI_MODELS[modelId];
    if (model?.isAvailable) {
      const health: ModelHealthStatus = {
        modelId,
        isHealthy: true,
        lastChecked: new Date().toISOString(),
        errorRate: 0,
        consecutiveFailures: 0
      };
      
      this.modelHealthCache.set(modelId, health);
      return health;
    }
    
    return null;
  }

  /**
   * Update model health cache
   */
  public updateModelHealth(modelId: AIModelId, health: ModelHealthStatus): void {
    this.modelHealthCache.set(modelId, health);
    this.lastHealthUpdate = Date.now();
  }

  /**
   * Get cost optimization recommendations
   */
  public getCostOptimizationRecommendations(
    criteria: ModelSelectionCriteria
  ): {
    currentSelection: AIModelId;
    recommendations: Array<{
      modelId: AIModelId;
      potentialSavings: number;
      tradeOffs: string[];
      confidence: number;
    }>;
  } {
    const currentDecision = this.selectOptimalModel(criteria);
    const currentCost = currentDecision.estimatedCost;
    
    // Get all viable alternatives
    const userPrefs = { ...DEFAULT_USER_PREFERENCES, ...criteria.userPreferences };
    const candidates = this.getCandidateModels(criteria, userPrefs);
    
    const recommendations = candidates
      .filter(modelId => modelId !== currentDecision.selectedModel)
      .map(modelId => {
        const cost = this.estimateRequestCost(modelId, criteria);
        const savings = Math.max(0, currentCost - cost);
        const metrics = this.getModelMetrics(modelId, criteria);
        
        return {
          modelId,
          potentialSavings: savings,
          tradeOffs: this.calculateTradeOffs(currentDecision.selectedModel, modelId),
          confidence: metrics.overallScore
        };
      })
      .filter(rec => rec.potentialSavings > 0)
      .sort((a, b) => b.potentialSavings - a.potentialSavings)
      .slice(0, 3);
    
    return {
      currentSelection: currentDecision.selectedModel,
      recommendations
    };
  }

  /**
   * Calculate trade-offs between two models
   */
  private calculateTradeOffs(currentModel: AIModelId, alternativeModel: AIModelId): string[] {
    const current = AI_MODELS[currentModel];
    const alternative = AI_MODELS[alternativeModel];
    const tradeOffs: string[] = [];
    
    if (alternative.performance.qualityScore < current.performance.qualityScore) {
      const diff = ((current.performance.qualityScore - alternative.performance.qualityScore) * 100).toFixed(0);
      tradeOffs.push(`${diff}% lower quality score`);
    }
    
    if (alternative.performance.avgResponseTime > current.performance.avgResponseTime) {
      const diff = (alternative.performance.avgResponseTime - current.performance.avgResponseTime).toFixed(1);
      tradeOffs.push(`${diff}s slower response`);
    }
    
    if (alternative.tier === 'experimental' && current.tier !== 'experimental') {
      tradeOffs.push('Experimental model - less stable');
    }
    
    return tradeOffs;
  }

  /**
   * Get load balancing recommendations
   */
  public getLoadBalancingRecommendation(criteria: ModelSelectionCriteria): AIModelId {
    const userPrefs = { ...DEFAULT_USER_PREFERENCES, ...criteria.userPreferences };
    const candidates = this.getCandidateModels(criteria, userPrefs);
    
    // Simple round-robin based on current minute
    const currentMinute = new Date().getMinutes();
    const selectedIndex = currentMinute % candidates.length;
    
    return candidates[selectedIndex] || candidates[0];
  }

  /**
   * Clear performance cache (useful for testing)
   */
  public clearCache(): void {
    this.performanceHistory.clear();
    this.modelHealthCache.clear();
    this.lastHealthUpdate = 0;
  }
}

// Export singleton instance
export const smartModelSelector = SmartModelSelector.getInstance();

/**
 * Convenience function for optimal model selection
 */
export function selectOptimalModel(criteria: ModelSelectionCriteria): EnhancedModelRoutingDecision {
  return smartModelSelector.selectOptimalModel(criteria);
}

/**
 * Convenience function for cost optimization recommendations
 */
export function getCostOptimizationRecommendations(criteria: ModelSelectionCriteria) {
  return smartModelSelector.getCostOptimizationRecommendations(criteria);
}

/**
 * Convenience function for load balancing
 */
export function getLoadBalancingRecommendation(criteria: ModelSelectionCriteria): AIModelId {
  return smartModelSelector.getLoadBalancingRecommendation(criteria);
}