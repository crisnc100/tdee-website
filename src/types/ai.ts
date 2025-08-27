/**
 * AI Model and Service Type Definitions for Multi-AI TDEE System
 * 
 * This module defines the core types for supporting multiple AI models
 * with intelligent routing, cost optimization, and performance tracking.
 */

/**
 * Supported AI model identifiers
 */
export type AIModelId = 
  | 'gpt-oss-120b'          // OpenAI's free open-source 120B model
  | 'qwen3-235b'            // Qwen3 235B - powerful multilingual model
  | 'gpt-4o-mini'           // Paid model - balanced cost/performance (backup)
  | 'gemini-2.0-flash-exp'; // Google's experimental free model

/**
 * Model tier classification for routing decisions
 */
export type ModelTier = 'premium' | 'standard' | 'free' | 'experimental';

/**
 * Model capabilities for task-specific routing
 */
export interface ModelCapabilities {
  /** Supports nutrition/health coaching tasks */
  nutrition: boolean;
  /** Supports meal planning and recipe adaptation */
  mealPlanning: boolean;
  /** Supports macro calculation insights */
  macroAnalysis: boolean;
  /** Supports creative/conversational responses */
  conversational: boolean;
  /** Maximum recommended tokens for this model */
  maxTokens: number;
  /** Optimal temperature range for this model */
  optimalTemperature: {
    min: number;
    max: number;
  };
}

/**
 * Pricing information per model
 */
export interface ModelPricing {
  /** Cost per 1M input tokens in USD */
  inputCostPer1M: number;
  /** Cost per 1M output tokens in USD */
  outputCostPer1M: number;
  /** Is this model free to use? */
  isFree: boolean;
  /** Daily/hourly rate limits if applicable */
  rateLimits?: {
    requestsPerHour?: number;
    requestsPerDay?: number;
    tokensPerDay?: number;
  };
}

/**
 * Performance characteristics for each model
 */
export interface ModelPerformance {
  /** Average response time in seconds */
  avgResponseTime: number;
  /** Reliability score (0-1) based on uptime */
  reliabilityScore: number;
  /** Quality score (0-1) for TDEE-specific tasks */
  qualityScore: number;
  /** Context window size */
  contextWindow: number;
}

/**
 * Complete AI model definition
 */
export interface AIModel {
  /** Unique identifier */
  id: AIModelId;
  /** Human-readable name */
  name: string;
  /** Brief description of model strengths */
  description: string;
  /** OpenRouter model identifier */
  openRouterModel: string;
  /** Model tier classification */
  tier: ModelTier;
  /** Model capabilities */
  capabilities: ModelCapabilities;
  /** Pricing information */
  pricing: ModelPricing;
  /** Performance metrics */
  performance: ModelPerformance;
  /** Is model currently available? */
  isAvailable: boolean;
  /** Priority for fallback routing (lower = higher priority) */
  fallbackPriority: number;
}

/**
 * AI service request configuration
 */
export interface AIRequest {
  /** Primary model to attempt */
  preferredModel?: AIModelId;
  /** Fallback models in order of preference */
  fallbackModels?: AIModelId[];
  /** Request type for model optimization */
  taskType: AITaskType;
  /** System prompt */
  systemPrompt?: string;
  /** User prompt/messages */
  messages: AIMessage[];
  /** Temperature override */
  temperature?: number;
  /** Max tokens override */
  maxTokens?: number;
  /** Enable automatic fallback on failure */
  enableFallback?: boolean;
  /** User preferences for model selection */
  userPreferences?: UserAIPreferences;
  /** Disable caching for this request */
  disableCache?: boolean;
}

/**
 * AI message format
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Task types for model optimization
 */
export type AITaskType = 
  | 'nutrition-coaching'     // Personalized nutrition advice
  | 'meal-planning'         // Meal suggestions and recipe adaptation
  | 'macro-analysis'        // Macro calculation insights
  | 'general-health'        // General health and fitness advice
  | 'conversational';       // Chat-like interactions

/**
 * AI service response
 */
export interface AIResponse {
  /** Generated content */
  content: string;
  /** Model that generated the response */
  modelUsed: AIModelId;
  /** Whether fallback was triggered */
  usedFallback: boolean;
  /** Response time in milliseconds */
  responseTime: number;
  /** Estimated cost in USD */
  estimatedCost: number;
  /** Token usage statistics */
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  /** Any warnings or notices */
  warnings?: string[];
}

/**
 * User preferences for AI model selection
 */
export interface UserAIPreferences {
  /** Prefer free models when possible */
  preferFreeModels: boolean;
  /** Maximum acceptable cost per request in USD */
  maxCostPerRequest?: number;
  /** Maximum acceptable response time in seconds */
  maxResponseTime?: number;
  /** Preferred model quality level */
  qualityPreference: 'fast' | 'balanced' | 'high-quality';
  /** Enable experimental models */
  allowExperimental?: boolean;
}

/**
 * Cost tracking and analytics
 */
export interface CostTracker {
  /** Daily spend by model */
  dailySpend: Record<AIModelId, number>;
  /** Total requests by model */
  requestCount: Record<AIModelId, number>;
  /** Total tokens used by model */
  tokenUsage: Record<AIModelId, { input: number; output: number }>;
  /** Last reset timestamp */
  lastReset: string;
}

/**
 * Model routing decision
 */
export interface ModelRoutingDecision {
  /** Selected model */
  selectedModel: AIModelId;
  /** Reason for selection */
  reason: string;
  /** Alternative models considered */
  alternatives: AIModelId[];
  /** Estimated cost */
  estimatedCost: number;
  /** Estimated response time */
  estimatedTime: number;
}

/**
 * AI service error types
 */
export interface AIServiceError extends Error {
  code: 'MODEL_UNAVAILABLE' | 'QUOTA_EXCEEDED' | 'INVALID_REQUEST' | 'NETWORK_ERROR' | 'PARSING_ERROR';
  modelId?: AIModelId;
  retryable: boolean;
  fallbackAvailable: boolean;
}

/**
 * Health check status for models
 */
export interface ModelHealthStatus {
  modelId: AIModelId;
  isHealthy: boolean;
  lastChecked: string;
  responseTime?: number;
  errorRate: number;
  consecutiveFailures: number;
}

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserAIPreferences = {
  preferFreeModels: true,
  maxCostPerRequest: 0.01, // 1 cent max per request
  maxResponseTime: 10, // 10 seconds max
  qualityPreference: 'balanced',
  allowExperimental: false
};

/**
 * Model configurations with all metadata
 */
export const AI_MODELS: Record<AIModelId, AIModel> = {
  'gpt-oss-120b': {
    id: 'gpt-oss-120b',
    name: 'GPT-OSS 120B',
    description: 'OpenAI\'s open-source 120B model optimized for reasoning and production use',
    openRouterModel: 'openai/gpt-oss-120b',
    tier: 'standard',
    capabilities: {
      nutrition: true,
      mealPlanning: true,
      macroAnalysis: true,
      conversational: true,
      maxTokens: 2048,
      optimalTemperature: { min: 0.6, max: 0.8 }
    },
    pricing: {
      inputCostPer1M: 0.072,   // $0.072 per 1M input tokens
      outputCostPer1M: 0.28,   // $0.28 per 1M output tokens  
      isFree: false  // Very low cost but not free
    },
    performance: {
      avgResponseTime: 3.0,
      reliabilityScore: 0.93,
      qualityScore: 0.92,
      contextWindow: 131000
    },
    isAvailable: true,
    fallbackPriority: 2
  },
  'qwen3-235b': {
    id: 'qwen3-235b',
    name: 'Qwen3 235B',
    displayName: '🧠 Deep Thinker (Premium)',
    description: 'Excels at complex problem-solving and breaking through plateaus',
    userBenefit: 'Best for troubleshooting issues and optimizing advanced strategies',
    openRouterModel: 'qwen/qwen3-235b-a22b-2507',
    tier: 'premium',
    capabilities: {
      nutrition: true,
      mealPlanning: true,
      macroAnalysis: true,
      conversational: true,
      maxTokens: 2048,
      optimalTemperature: { min: 0.5, max: 0.7 }
    },
    pricing: {
      inputCostPer1M: 0.078,   // $0.078 per 1M input tokens
      outputCostPer1M: 0.312,  // $0.312 per 1M output tokens  
      isFree: false
    },
    performance: {
      avgResponseTime: 3.5,
      reliabilityScore: 0.94,
      qualityScore: 0.95,  // Excellent for reasoning and math
      contextWindow: 262144  // 262K context
    },
    isAvailable: true,
    fallbackPriority: 2
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'OpenAI\'s efficient model with excellent instruction following for health and nutrition tasks',
    openRouterModel: 'openai/gpt-4o-mini',
    tier: 'standard',
    capabilities: {
      nutrition: true,
      mealPlanning: true,
      macroAnalysis: true,
      conversational: true,
      maxTokens: 2048,
      optimalTemperature: { min: 0.5, max: 0.9 }
    },
    pricing: {
      inputCostPer1M: 0.15,   // $0.15 per 1M input tokens
      outputCostPer1M: 0.60,  // $0.60 per 1M output tokens  
      isFree: false
    },
    performance: {
      avgResponseTime: 2.5,
      reliabilityScore: 0.95,
      qualityScore: 0.88,
      contextWindow: 128000
    },
    isAvailable: true,
    fallbackPriority: 3  // Now a fallback option
  },
  'qwq-32b': {
    id: 'qwq-32b',
    name: 'QwQ 32B',
    description: 'Qwen\'s advanced reasoning model with strong analytical capabilities',
    openRouterModel: 'qwen/qwq-32b:free',
    tier: 'free',
    capabilities: {
      nutrition: true,
      mealPlanning: true,
      macroAnalysis: true,
      conversational: true,
      maxTokens: 2048,
      optimalTemperature: { min: 0.5, max: 0.7 }
    },
    pricing: {
      inputCostPer1M: 0,
      outputCostPer1M: 0,
      isFree: true,
      rateLimits: {
        requestsPerHour: 100,
        requestsPerDay: 1000
      }
    },
    performance: {
      avgResponseTime: 4.0,
      reliabilityScore: 0.88,
      qualityScore: 0.90, // Better reasoning than older models
      contextWindow: 32768
    },
    isAvailable: false, // Disabled - shows internal reasoning to users
    fallbackPriority: 99
  },
  'deepseek-chat': {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat v3',
    description: 'High-performance free model with excellent comprehension',
    openRouterModel: 'deepseek/deepseek-chat-v3-0324:free',
    tier: 'free',
    capabilities: {
      nutrition: true,
      mealPlanning: true,
      macroAnalysis: true,
      conversational: true,
      maxTokens: 2048,
      optimalTemperature: { min: 0.6, max: 0.8 }
    },
    pricing: {
      inputCostPer1M: 0,
      outputCostPer1M: 0,
      isFree: true,
      rateLimits: {
        requestsPerHour: 150,
        requestsPerDay: 1500
      }
    },
    performance: {
      avgResponseTime: 3.5,
      reliabilityScore: 0.92,
      qualityScore: 0.88,
      contextWindow: 65536
    },
    isAvailable: true,
    fallbackPriority: 10
  },
  'gemini-2.0-flash-exp': {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Experimental)',
    description: 'Google\'s latest experimental model with fast inference and strong analytical capabilities',
    openRouterModel: 'google/gemini-2.0-flash-exp:free',
    tier: 'experimental',
    capabilities: {
      nutrition: true,
      mealPlanning: true,
      macroAnalysis: true,
      conversational: true,
      maxTokens: 2048,
      optimalTemperature: { min: 0.4, max: 0.8 }
    },
    pricing: {
      inputCostPer1M: 0,
      outputCostPer1M: 0,
      isFree: true,
      rateLimits: {
        requestsPerHour: 100,
        requestsPerDay: 1000
      }
    },
    performance: {
      avgResponseTime: 2.0,
      reliabilityScore: 0.85, // Lower due to experimental status
      qualityScore: 0.85,
      contextWindow: 1000000
    },
    isAvailable: true,
    fallbackPriority: 1
  },
  'claude-3.5-sonnet': {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Legacy premium model with excellent reasoning and safety features',
    openRouterModel: 'anthropic/claude-3.5-sonnet',
    tier: 'premium',
    capabilities: {
      nutrition: true,
      mealPlanning: true,
      macroAnalysis: true,
      conversational: true,
      maxTokens: 2048,
      optimalTemperature: { min: 0.6, max: 0.9 }
    },
    pricing: {
      inputCostPer1M: 3.00,   // $3.00 per 1M input tokens
      outputCostPer1M: 15.00, // $15.00 per 1M output tokens
      isFree: false
    },
    performance: {
      avgResponseTime: 4.0,
      reliabilityScore: 0.98,
      qualityScore: 0.95,
      contextWindow: 200000
    },
    isAvailable: true,
    fallbackPriority: 7 // Last resort due to high cost
  }
};

/**
 * Task-specific model recommendations
 */
export const TASK_MODEL_RECOMMENDATIONS: Record<AITaskType, AIModelId[]> = {
  'nutrition-coaching': ['gemini-2.0-flash-exp', 'gpt-oss-120b', 'qwen3-235b', 'gpt-4o-mini'],   // Gemini first - fast & free
  'meal-planning': ['gemini-2.0-flash-exp', 'gpt-oss-120b', 'qwen3-235b', 'gpt-4o-mini'],        // Gemini for quick meal plans
  'macro-analysis': ['qwen3-235b', 'gemini-2.0-flash-exp', 'gpt-oss-120b', 'gpt-4o-mini'],       // Qwen3 excels at math/reasoning
  'general-health': ['gemini-2.0-flash-exp', 'gpt-oss-120b', 'qwen3-235b', 'gpt-4o-mini'],       // Gemini for general questions
  'conversational': ['gemini-2.0-flash-exp', 'gpt-oss-120b', 'qwen3-235b', 'gpt-4o-mini']        // Gemini for fast chat responses
};