import { NextRequest, NextResponse } from 'next/server';

/**
 * User Preferences API Route
 * 
 * Provides server-side preference validation, backup/restore functionality,
 * and analytics endpoints for the multi-AI preference system.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'validate':
        // Validate preferences against current model availability
        return validatePreferences();
      
      case 'models':
        // Get current model availability and status
        return getModelStatus();
      
      case 'defaults':
        // Get default preferences
        return getDefaultPreferences();
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in preferences API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'validate':
        return validateUserPreferences(data);
      
      case 'backup':
        return createPreferencesBackup(data);
      
      case 'restore':
        return restorePreferencesBackup(data);
      
      case 'analytics':
        return getUsageAnalytics(data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in preferences POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function validatePreferences() {
  const { AI_MODELS, DEFAULT_USER_PREFERENCES } = await import('@/types/ai');
  
  const availableModels = Object.entries(AI_MODELS)
    .filter(([_, model]) => model.isAvailable)
    .map(([id, model]) => ({
      id,
      name: model.name,
      tier: model.tier,
      isFree: model.pricing.isFree,
      capabilities: model.capabilities
    }));

  return NextResponse.json({
    availableModels,
    validationRules: {
      maxCostPerRequest: { min: 0, max: 1.0 },
      maxResponseTime: { min: 1, max: 60 },
      quickSwitchModels: { maxCount: 5 }
    },
    defaults: DEFAULT_USER_PREFERENCES
  });
}

async function getModelStatus() {
  const { AI_MODELS } = await import('@/types/ai');
  const { aiService } = await import('@/lib/aiService');
  
  const modelHealth = aiService.getModelHealth();
  const costAnalytics = aiService.getCostAnalytics();
  
  const modelStatus = Object.entries(AI_MODELS).map(([id, model]) => ({
    id,
    name: model.name,
    isAvailable: model.isAvailable,
    health: modelHealth[id as keyof typeof modelHealth] || {
      isHealthy: true,
      errorRate: 0,
      consecutiveFailures: 0
    },
    dailyUsage: {
      requests: costAnalytics.requestCount[id as keyof typeof costAnalytics.requestCount] || 0,
      cost: costAnalytics.dailySpend[id as keyof typeof costAnalytics.dailySpend] || 0,
      tokens: costAnalytics.tokenUsage[id as keyof typeof costAnalytics.tokenUsage] || { input: 0, output: 0 }
    }
  }));

  return NextResponse.json({
    models: modelStatus,
    systemHealth: {
      totalRequests: Object.values(costAnalytics.requestCount).reduce((a, b) => a + b, 0),
      totalCost: Object.values(costAnalytics.dailySpend).reduce((a, b) => a + b, 0),
      lastReset: costAnalytics.lastReset
    }
  });
}

async function getDefaultPreferences() {
  const { DEFAULT_USER_PREFERENCES } = await import('@/types/ai');
  
  const defaultExtendedPreferences = {
    ...DEFAULT_USER_PREFERENCES,
    showCostEstimates: true,
    showModelDetails: false,
    enableAdvancedSettings: false,
    coachingTone: 'balanced' as const,
    coachingFrequency: 'normal' as const,
    allowTelemetry: true,
    saveConversationHistory: false,
    quickSwitchModels: ['qwen2.5-7b-instruct', 'gpt-4o-mini', 'gemini-2.0-flash-exp'] as const
  };
  
  return NextResponse.json({
    preferences: defaultExtendedPreferences,
    timestamp: new Date().toISOString()
  });
}

async function validateUserPreferences(preferences: any) {
  const { AI_MODELS } = await import('@/types/ai');
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate cost limits
  if (preferences.maxCostPerRequest !== undefined) {
    if (preferences.maxCostPerRequest < 0 || preferences.maxCostPerRequest > 1.0) {
      errors.push('maxCostPerRequest must be between 0 and 1.0');
    }
  }
  
  // Validate response time
  if (preferences.maxResponseTime !== undefined) {
    if (preferences.maxResponseTime < 1 || preferences.maxResponseTime > 60) {
      errors.push('maxResponseTime must be between 1 and 60 seconds');
    }
  }
  
  // Validate quick switch models
  if (preferences.quickSwitchModels) {
    if (preferences.quickSwitchModels.length > 5) {
      errors.push('quickSwitchModels can contain at most 5 models');
    }
    
    const invalidModels = preferences.quickSwitchModels.filter(
      (id: string) => !AI_MODELS[id as keyof typeof AI_MODELS]?.isAvailable
    );
    
    if (invalidModels.length > 0) {
      warnings.push(`Models not available: ${invalidModels.join(', ')}`);
    }
  }
  
  // Validate default model
  if (preferences.defaultModel) {
    const model = AI_MODELS[preferences.defaultModel as keyof typeof AI_MODELS];
    if (!model || !model.isAvailable) {
      warnings.push('Default model is not available');
    }
  }
  
  const isValid = errors.length === 0;
  
  return NextResponse.json({
    isValid,
    errors,
    warnings,
    sanitized: isValid ? preferences : null
  });
}

async function createPreferencesBackup(data: any) {
  // Simulate server-side backup creation with validation
  const backup = {
    preferences: data.preferences,
    modelStats: data.modelStats,
    costTracking: data.costTracking,
    metadata: {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      source: 'web-app'
    }
  };
  
  return NextResponse.json({
    backup,
    checksum: generateChecksum(backup),
    size: JSON.stringify(backup).length
  });
}

async function restorePreferencesBackup(data: any) {
  // Validate backup format and integrity
  const { backup, checksum } = data;
  
  if (!backup || !backup.preferences) {
    return NextResponse.json(
      { error: 'Invalid backup format' },
      { status: 400 }
    );
  }
  
  // Verify checksum if provided
  if (checksum && generateChecksum(backup) !== checksum) {
    return NextResponse.json(
      { error: 'Backup integrity check failed' },
      { status: 400 }
    );
  }
  
  // Validate preferences
  const validation = await validateUserPreferences(backup.preferences);
  const validationResult = await validation.json();
  
  return NextResponse.json({
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    warnings: validationResult.warnings,
    restoredData: validationResult.isValid ? backup : null
  });
}

async function getUsageAnalytics(data: any) {
  // Generate usage analytics based on user's data
  const { modelStats, preferences, timeRange = '7d' } = data;
  
  if (!modelStats || !Array.isArray(modelStats)) {
    return NextResponse.json(
      { error: 'Invalid model stats data' },
      { status: 400 }
    );
  }
  
  const analytics = {
    totalRequests: modelStats.reduce((sum, stat) => sum + stat.requestCount, 0),
    totalCost: modelStats.reduce((sum, stat) => sum + stat.totalCost, 0),
    averageResponseTime: calculateAverageResponseTime(modelStats),
    mostUsedModel: findMostUsedModel(modelStats),
    costSavings: calculateCostSavings(modelStats),
    recommendations: generateRecommendations(modelStats, preferences)
  };
  
  return NextResponse.json({
    analytics,
    timeRange,
    generatedAt: new Date().toISOString()
  });
}

function generateChecksum(data: any): string {
  // Simple checksum generation (in production, use proper crypto)
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

function calculateAverageResponseTime(modelStats: any[]): number {
  if (modelStats.length === 0) return 0;
  
  const totalTime = modelStats.reduce((sum, stat) => 
    sum + (stat.avgResponseTime * stat.requestCount), 0
  );
  const totalRequests = modelStats.reduce((sum, stat) => sum + stat.requestCount, 0);
  
  return totalRequests > 0 ? totalTime / totalRequests : 0;
}

function findMostUsedModel(modelStats: any[]): any {
  if (modelStats.length === 0) return null;
  
  return modelStats.reduce((max, stat) => 
    stat.requestCount > max.requestCount ? stat : max
  );
}

function calculateCostSavings(modelStats: any[]): any {
  // Calculate savings from using free models vs. paid models
  const { AI_MODELS } = require('@/types/ai');
  
  let freeModelRequests = 0;
  let totalRequests = 0;
  let actualCost = 0;
  let estimatedPaidCost = 0;
  
  for (const stat of modelStats) {
    const model = AI_MODELS[stat.modelId];
    if (model) {
      totalRequests += stat.requestCount;
      actualCost += stat.totalCost;
      
      if (model.pricing.isFree) {
        freeModelRequests += stat.requestCount;
        // Estimate cost if using GPT-4o-mini instead
        estimatedPaidCost += stat.requestCount * 0.003; // ~$0.003 per request
      } else {
        estimatedPaidCost += stat.totalCost;
      }
    }
  }
  
  const savings = estimatedPaidCost - actualCost;
  const savingsPercentage = estimatedPaidCost > 0 ? (savings / estimatedPaidCost) * 100 : 0;
  
  return {
    actualCost,
    estimatedPaidCost,
    totalSavings: savings,
    savingsPercentage: Math.round(savingsPercentage),
    freeModelUsage: freeModelRequests,
    freeModelPercentage: totalRequests > 0 ? Math.round((freeModelRequests / totalRequests) * 100) : 0
  };
}

function generateRecommendations(modelStats: any[], preferences: any): string[] {
  const recommendations: string[] = [];
  
  // Analyze usage patterns
  const totalRequests = modelStats.reduce((sum, stat) => sum + stat.requestCount, 0);
  const avgCost = modelStats.reduce((sum, stat) => sum + stat.totalCost, 0) / totalRequests;
  
  if (totalRequests < 10) {
    recommendations.push("Use the AI features more to get personalized model recommendations");
  }
  
  if (avgCost > 0.01) {
    recommendations.push("Consider using free models for routine tasks to reduce costs");
  }
  
  if (preferences.quickSwitchModels?.length < 3) {
    recommendations.push("Add more models to your quick switch list for better flexibility");
  }
  
  // Find underperforming models
  const poorPerformers = modelStats.filter(stat => 
    stat.successRate < 0.9 && stat.requestCount > 5
  );
  
  if (poorPerformers.length > 0) {
    recommendations.push(`Consider avoiding ${poorPerformers[0].modelId} due to low success rate`);
  }
  
  return recommendations;
}