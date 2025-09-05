'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  TrendingUp,
  DollarSign,
  Zap,
  ChevronDown,
  Activity,
  Award,
  AlertCircle,
  CheckCircle,
  Wifi
} from 'lucide-react';
import { AI_MODELS } from '@/types/ai';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface AIStatusBarProps {
  className?: string;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

/**
 * AI Status Bar Component
 * 
 * A compact, mobile-friendly status bar that shows current AI system
 * performance, cost savings, and health metrics at a glance.
 */
export default function AIStatusBar({ 
  className = '',
  onToggleDetails
}: AIStatusBarProps) {
  const { preferences, getModelUsageStats, getCostTracking } = useUserPreferences();
  const [stats, setStats] = useState(getModelUsageStats());
  const [costData, setCostData] = useState(getCostTracking());
  const [isExpanded, setIsExpanded] = useState(false);

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      setStats(getModelUsageStats());
      setCostData(getCostTracking());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, [getModelUsageStats, getCostTracking]);

  // Calculate summary metrics
  const totalRequests = stats.reduce((sum, stat) => sum + stat.requestCount, 0);
  const totalSavings = stats.reduce((sum, stat) => sum + (stat.totalSavings || 0), 0);
  const avgSuccessRate = stats.length > 0 ? 
    stats.reduce((sum, stat) => sum + (stat.successCount / Math.max(stat.requestCount, 1)), 0) / stats.length : 0;
  
  // Get current model status
  const activeModels = stats.filter(stat => stat.requestCount > 0);
  const primaryModel = activeModels.length > 0 ? 
    activeModels.reduce((best, current) => current.requestCount > best.requestCount ? current : best) :
    null;

  // System health indicator
  const systemHealth = avgSuccessRate >= 0.9 ? 'excellent' : 
                      avgSuccessRate >= 0.8 ? 'good' : 
                      avgSuccessRate >= 0.7 ? 'fair' : 'poor';

  const getHealthColor = () => {
    switch (systemHealth) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = () => {
    switch (systemHealth) {
      case 'excellent': return CheckCircle;
      case 'good': return CheckCircle;
      case 'fair': return AlertCircle;
      case 'poor': return AlertCircle;
      default: return Activity;
    }
  };

  const HealthIcon = getHealthIcon();

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    onToggleDetails?.();
  };

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      {/* Main Status Bar */}
      <div className="px-4 py-2">
        <button
          onClick={toggleExpanded}
          className="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-lg p-2"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* AI System Indicator */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">AI System</span>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getHealthColor()}`}>
                    <HealthIcon className="w-3 h-3" />
                    {systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)}
                  </div>
                </div>
                {primaryModel && (
                  <div className="text-xs text-gray-500 truncate">
                    Primary: {AI_MODELS[primaryModel.modelId]?.name || primaryModel.modelId}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span>{totalRequests} requests</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Award className="w-3 h-3 text-green-600" />
                <span className="text-green-600 font-medium">${totalSavings.toFixed(4)} saved</span>
              </div>
              
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-600" />
                <span>{(avgSuccessRate * 100).toFixed(0)}% success</span>
              </div>
            </div>
          </div>

          {/* Expand Indicator */}
          <div className="flex items-center gap-2">
            {/* Mobile Quick Stats */}
            <div className="sm:hidden flex items-center gap-2 text-xs">
              <span className="text-green-600 font-medium">${totalSavings.toFixed(2)}</span>
              <span className="text-gray-500">•</span>
              <span className="text-blue-600">{(avgSuccessRate * 100).toFixed(0)}%</span>
            </div>
            
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`} />
          </div>
        </button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Detailed Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-900">Total Requests</span>
                  </div>
                  <div className="text-lg font-bold text-blue-900">{totalRequests}</div>
                  <div className="text-xs text-blue-600">All-time</div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-900">Cost Savings</span>
                  </div>
                  <div className="text-lg font-bold text-green-900">${totalSavings.toFixed(4)}</div>
                  <div className="text-xs text-green-600">vs premium models</div>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-900">Success Rate</span>
                  </div>
                  <div className="text-lg font-bold text-purple-900">{(avgSuccessRate * 100).toFixed(0)}%</div>
                  <div className="text-xs text-purple-600">Average across models</div>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-medium text-orange-900">Free Usage</span>
                  </div>
                  <div className="text-lg font-bold text-orange-900">
                    {totalRequests > 0 ? 
                      Math.round((stats.filter(s => AI_MODELS[s.modelId]?.pricing.isFree)
                        .reduce((sum, s) => sum + s.requestCount, 0) / totalRequests) * 100) : 0}%
                  </div>
                  <div className="text-xs text-orange-600">of all requests</div>
                </div>
              </div>

              {/* Active Models */}
              {activeModels.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-gray-600" />
                    Active Models
                  </h4>
                  <div className="space-y-2">
                    {activeModels.slice(0, 3).map((stat) => {
                      const model = AI_MODELS[stat.modelId];
                      if (!model) return null;

                      const successRate = stat.successCount / Math.max(stat.requestCount, 1);
                      
                      return (
                        <div key={stat.modelId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              model.pricing.isFree ? 'bg-green-100' : 'bg-purple-100'
                            }`}>
                              {model.pricing.isFree ? (
                                <Sparkles className="w-3 h-3 text-green-600" />
                              ) : (
                                <Zap className="w-3 h-3 text-purple-600" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{model.name}</div>
                              <div className="text-xs text-gray-500">{stat.requestCount} requests</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs">
                            <div className={`flex items-center gap-1 ${
                              successRate >= 0.9 ? 'text-green-600' :
                              successRate >= 0.7 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              <Activity className="w-3 h-3" />
                              {(successRate * 100).toFixed(0)}%
                            </div>
                            
                            {model.pricing.isFree && (
                              <div className="flex items-center gap-1 text-green-600">
                                <DollarSign className="w-3 h-3" />
                                Free
                              </div>
                            )}
                            
                            <div className={`flex items-center gap-1 ${
                              model.isAvailable ? 'text-green-600' : 'text-red-600'
                            }`}>
                              <Wifi className="w-3 h-3" />
                              {model.isAvailable ? 'Online' : 'Offline'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* System Optimization Message */}
              {totalSavings > 0.001 && (
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Smart Routing Active
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Our AI system automatically routes requests to free models when possible, 
                    saving you money while maintaining quality responses.
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('refreshAIMetrics'))}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}