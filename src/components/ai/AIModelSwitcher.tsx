'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Zap,
  DollarSign,
  Clock,
  Settings,
  Star,
  Sparkles,
  TrendingUp,
  Activity,
  Award,
  AlertCircle,
  Wifi
} from 'lucide-react';
import { AI_MODELS, AIModelId } from '@/types/ai';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface AIModelSwitcherProps {
  selectedModel?: AIModelId;
  onModelChange: (modelId: AIModelId) => void;
  showCostEstimate?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Quick AI Model Switcher Component
 * 
 * Provides a dropdown interface for quickly switching between AI models
 * with cost estimates and performance indicators. Integrates with user
 * preferences and usage statistics.
 */
export default function AIModelSwitcher({
  selectedModel,
  onModelChange,
  showCostEstimate = true,
  compact = false,
  className = ''
}: AIModelSwitcherProps) {
  const { preferences, getModelUsageStats } = useUserPreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [modelStats] = useState(getModelUsageStats());
  const [realTimeMetrics, setRealTimeMetrics] = useState<Record<AIModelId, {
    avgResponseTime: number;
    successRate: number;
    costSavings: number;
    recentUses: number;
  }>>(() => {
    // Initialize with default values for all models
    const defaultMetrics: Record<AIModelId, {
      avgResponseTime: number;
      successRate: number;
      costSavings: number;
      recentUses: number;
    }> = {} as any;
    
    Object.keys(AI_MODELS).forEach(modelId => {
      const model = AI_MODELS[modelId as AIModelId];
      defaultMetrics[modelId as AIModelId] = {
        avgResponseTime: model.performance.avgResponseTime * 1000,
        successRate: 0.95, // Default 95% success rate
        costSavings: 0,
        recentUses: 0
      };
    });
    
    return defaultMetrics;
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Update real-time metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      const stats = getModelUsageStats();
      setRealTimeMetrics(prevMetrics => {
        const newMetrics = { ...prevMetrics };
        
        stats.forEach(stat => {
          const model = AI_MODELS[stat.modelId];
          if (model) {
            newMetrics[stat.modelId] = {
              avgResponseTime: stat.avgResponseTime || model.performance.avgResponseTime * 1000,
              successRate: stat.successCount / Math.max(stat.requestCount, 1),
              costSavings: stat.totalSavings || 0,
              recentUses: stat.requestCount
            };
          }
        });
        
        return newMetrics;
      });
    };
    
    updateMetrics();
    const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [getModelUsageStats]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get available models from quick switch preferences
  const availableModels = preferences.quickSwitchModels.length > 0 
    ? preferences.quickSwitchModels.map(id => AI_MODELS[id]).filter(Boolean)
    : Object.values(AI_MODELS).filter(model => model.isAvailable);

  // Current selected model or default
  const currentModel = selectedModel 
    ? AI_MODELS[selectedModel] 
    : (preferences.defaultModel ? AI_MODELS[preferences.defaultModel] : availableModels[0]);

  /**
   * Get estimated cost for a typical request
   */
  const getEstimatedCost = (modelId: AIModelId) => {
    const model = AI_MODELS[modelId];
    if (model.pricing.isFree) return 'Free';
    
    // Estimate for ~500 input + 200 output tokens
    const inputCost = (500 / 1_000_000) * model.pricing.inputCostPer1M;
    const outputCost = (200 / 1_000_000) * model.pricing.outputCostPer1M;
    const total = inputCost + outputCost;
    
    return `$${total.toFixed(4)}`;
  };

  /**
   * Get user rating for model
   */
  const getUserRating = (modelId: AIModelId) => {
    return modelStats.find(stat => stat.modelId === modelId)?.userRating;
  };

  /**
   * Handle model selection
   */
  const handleModelSelect = (modelId: AIModelId) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  if (!currentModel) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Current Model Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full p-3 bg-white border border-gray-200 rounded-lg
          hover:border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500
          transition-all duration-200 group
          ${compact ? 'p-2' : 'p-3'}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Model Icon/Indicator */}
          <div className="flex-shrink-0">
            {currentModel.pricing.isFree ? (
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-green-600" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
            )}
          </div>

          {/* Model Info */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-medium text-gray-900 truncate ${compact ? 'text-sm' : ''}`}>
                {compact ? currentModel.name.split(' ')[0] : currentModel.name}
              </span>
              
              {currentModel.pricing.isFree && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                  Free
                </span>
              )}
              
              {currentModel === AI_MODELS[preferences.defaultModel!] && (
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                  Default
                </span>
              )}
            </div>

            {!compact && (
              <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {realTimeMetrics[currentModel.id] ? 
                    `${(realTimeMetrics[currentModel.id].avgResponseTime / 1000).toFixed(1)}s` :
                    `${currentModel.performance.avgResponseTime}s`
                  }
                </div>
                
                {/* Real-time Performance for Current Model */}
                {realTimeMetrics[currentModel.id] && realTimeMetrics[currentModel.id].recentUses > 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className={`w-3 h-3 ${
                      realTimeMetrics[currentModel.id].successRate >= 0.9 ? 'text-green-500' :
                      realTimeMetrics[currentModel.id].successRate >= 0.7 ? 'text-yellow-500' :
                      'text-red-500'
                    }`} />
                    <span className={realTimeMetrics[currentModel.id].successRate >= 0.9 ? 'text-green-600' :
                                   realTimeMetrics[currentModel.id].successRate >= 0.7 ? 'text-yellow-600' :
                                   'text-red-600'}>
                      {(realTimeMetrics[currentModel.id].successRate * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                
                {showCostEstimate && preferences.showCostEstimates && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {getEstimatedCost(currentModel.id)}
                  </div>
                )}
                
                {/* Cost Savings Indicator */}
                {realTimeMetrics[currentModel.id] && realTimeMetrics[currentModel.id].costSavings > 0 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Award className="w-3 h-3" />
                    <span className="font-medium">
                      Saved ${realTimeMetrics[currentModel.id].costSavings.toFixed(4)}
                    </span>
                  </div>
                )}

                {getUserRating(currentModel.id) && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
                    {getUserRating(currentModel.id)}
                  </div>
                )}
                
                {/* Status Indicator */}
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    currentModel.isAvailable ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className={`text-xs ${
                    currentModel.isAvailable ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentModel.isAvailable ? 'Live' : 'Down'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            <div className="py-1">
              {availableModels.map((model) => {
                const isSelected = currentModel.id === model.id;
                const userRating = getUserRating(model.id);
                const stats = modelStats.find(s => s.modelId === model.id);

                return (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model.id)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                      ${isSelected ? 'bg-purple-50' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Model Icon */}
                      <div className="flex-shrink-0">
                        {model.pricing.isFree ? (
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <Zap className="w-3 h-3 text-purple-600" />
                          </div>
                        )}
                      </div>

                      {/* Model Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {model.name}
                          </span>
                          
                          {model.pricing.isFree && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                              Free
                            </span>
                          )}
                          
                          {model.tier === 'experimental' && (
                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                              Beta
                            </span>
                          )}

                          {isSelected && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                              Current
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {realTimeMetrics[model.id] ? 
                              `${(realTimeMetrics[model.id].avgResponseTime / 1000).toFixed(1)}s` :
                              `${model.performance.avgResponseTime}s`
                            }
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {(model.performance.qualityScore * 100).toFixed(0)}%
                          </div>
                          
                          {/* Real-time Performance Indicators */}
                          {realTimeMetrics[model.id] && realTimeMetrics[model.id].recentUses > 0 && (
                            <>
                              <div className="flex items-center gap-1">
                                <Activity className={`w-3 h-3 ${
                                  realTimeMetrics[model.id].successRate >= 0.9 ? 'text-green-500' :
                                  realTimeMetrics[model.id].successRate >= 0.7 ? 'text-yellow-500' :
                                  'text-red-500'
                                }`} />
                                {(realTimeMetrics[model.id].successRate * 100).toFixed(0)}%
                              </div>
                              
                              {realTimeMetrics[model.id].costSavings > 0 && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Award className="w-3 h-3" />
                                  Saved ${realTimeMetrics[model.id].costSavings.toFixed(4)}
                                </div>
                              )}
                            </>
                          )}
                          
                          {showCostEstimate && preferences.showCostEstimates && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {getEstimatedCost(model.id)}
                            </div>
                          )}

                          {userRating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
                              {userRating}
                            </div>
                          )}

                          {stats && (
                            <div className="text-gray-400">
                              {stats.requestCount} uses
                            </div>
                          )}
                          
                          {/* Model Status Indicator */}
                          <div className="flex items-center gap-1">
                            <Wifi className={`w-3 h-3 ${
                              model.isAvailable ? 'text-green-500' : 'text-red-500'
                            }`} />
                            <span className={model.isAvailable ? 'text-green-600' : 'text-red-600'}>
                              {model.isAvailable ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Settings Link */}
            <div className="border-t border-gray-100 px-4 py-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // This would navigate to settings - implement based on your routing
                  console.log('Navigate to AI settings');
                }}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings className="w-4 h-4" />
                AI Settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}