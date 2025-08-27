'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Zap,
  DollarSign,
  Clock,
  Star,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Shield,
  Brain,
  Target
} from 'lucide-react';
import { AI_MODELS, AIModelId, AIModel } from '@/types/ai';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { ExtendedUserPreferences } from '@/lib/userPreferences';

/**
 * AI Model Settings Component
 * 
 * Provides a comprehensive interface for users to configure their AI model
 * preferences, view cost estimates, track usage, and manage settings.
 */
export default function AIModelSettings() {
  const {
    preferences,
    updatePreferences,
    getModelUsageStats,
    getCostTracking,
    rateModel,
    resetToDefaults,
    exportPreferences,
    importPreferences
  } = useUserPreferences();

  const [activeTab, setActiveTab] = useState<'models' | 'costs' | 'usage' | 'advanced'>('models');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [modelStats, setModelStats] = useState(getModelUsageStats());
  const [costTracking, setCostTracking] = useState(getCostTracking());
  const [selectedModel, setSelectedModel] = useState<AIModelId | null>(null);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setModelStats(getModelUsageStats());
      setCostTracking(getCostTracking());
    }, 5000);

    return () => clearInterval(interval);
  }, [getModelUsageStats, getCostTracking]);

  /**
   * Model selection and preference handlers
   */
  const handleModelPreferenceToggle = (modelId: AIModelId) => {
    const currentModels = preferences.quickSwitchModels;
    const isSelected = currentModels.includes(modelId);

    if (isSelected) {
      updatePreferences({
        quickSwitchModels: currentModels.filter(id => id !== modelId)
      });
    } else if (currentModels.length < 5) {
      updatePreferences({
        quickSwitchModels: [...currentModels, modelId]
      });
    }
  };

  const handleDefaultModelSet = (modelId: AIModelId) => {
    updatePreferences({ defaultModel: modelId });
  };

  const handleQualityPreferenceChange = (quality: 'fast' | 'balanced' | 'high-quality') => {
    updatePreferences({ qualityPreference: quality });
  };

  const handleCostLimitChange = (limit: number) => {
    updatePreferences({ maxCostPerRequest: limit });
  };

  const handleResponseTimeChange = (time: number) => {
    updatePreferences({ maxResponseTime: time });
  };

  /**
   * File import/export handlers
   */
  const handleExport = () => {
    const data = exportPreferences();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-preferences-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      if (importPreferences(data)) {
        // Refresh stats after import
        setModelStats(getModelUsageStats());
        setCostTracking(getCostTracking());
      }
    };
    reader.readAsText(file);
  };

  /**
   * Get model performance indicator
   */
  const getModelPerformanceColor = (model: AIModel) => {
    const score = model.performance.qualityScore;
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-yellow-600';
    return 'text-orange-600';
  };

  /**
   * Get cost estimate for typical request
   */
  const getEstimatedCost = (model: AIModel) => {
    if (model.pricing.isFree) return 'Free';
    
    // Estimate for ~500 input + 200 output tokens (typical TDEE request)
    const inputCost = (500 / 1_000_000) * model.pricing.inputCostPer1M;
    const outputCost = (200 / 1_000_000) * model.pricing.outputCostPer1M;
    const total = inputCost + outputCost;
    
    return `$${total.toFixed(4)}`;
  };

  /**
   * Render model card component
   */
  const ModelCard = ({ model, stats }: { model: AIModel; stats?: any }) => {
    const isInQuickSwitch = preferences.quickSwitchModels.includes(model.id);
    const isDefault = preferences.defaultModel === model.id;
    const cost = getEstimatedCost(model);

    return (
      <motion.div
        layout
        className={`p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer
          ${isDefault 
            ? 'border-purple-500 bg-purple-50' 
            : isInQuickSwitch 
              ? 'border-blue-300 bg-blue-50 hover:border-blue-400' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        onClick={() => setSelectedModel(selectedModel === model.id ? null : model.id)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{model.name}</h3>
              {model.pricing.isFree && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  Free
                </span>
              )}
              {model.tier === 'experimental' && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                  Beta
                </span>
              )}
              {isDefault && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">{model.description}</p>
            
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className={`font-medium ${getModelPerformanceColor(model)}`}>
                  {(model.performance.qualityScore * 100).toFixed(0)}% quality
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-500" />
                <span className="text-gray-600">{model.performance.avgResponseTime}s</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-green-500" />
                <span className="text-gray-600">{cost}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDefaultModelSet(model.id);
              }}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                isDefault
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700'
              }`}
            >
              {isDefault ? 'Default' : 'Set Default'}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleModelPreferenceToggle(model.id);
              }}
              disabled={!isInQuickSwitch && preferences.quickSwitchModels.length >= 5}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                isInQuickSwitch
                  ? 'bg-blue-500 text-white'
                  : preferences.quickSwitchModels.length >= 5
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
              }`}
            >
              {isInQuickSwitch ? 'In Quick Switch' : 'Add to Quick Switch'}
            </button>
          </div>
        </div>

        {/* Expanded model details */}
        <AnimatePresence>
          {selectedModel === model.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-200 pt-3 mt-3"
            >
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Capabilities</h4>
                  <div className="space-y-1">
                    {model.capabilities.nutrition && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Target className="w-3 h-3" />
                        Nutrition Coaching
                      </div>
                    )}
                    {model.capabilities.mealPlanning && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Brain className="w-3 h-3" />
                        Meal Planning
                      </div>
                    )}
                    {model.capabilities.macroAnalysis && (
                      <div className="flex items-center gap-1 text-xs text-purple-600">
                        <TrendingUp className="w-3 h-3" />
                        Macro Analysis
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Performance</h4>
                  <div className="space-y-1 text-xs">
                    <div>Reliability: {(model.performance.reliabilityScore * 100).toFixed(0)}%</div>
                    <div>Context: {(model.performance.contextWindow / 1000).toFixed(0)}K tokens</div>
                    <div>Max Output: {(model.capabilities.maxTokens / 1000).toFixed(1)}K tokens</div>
                  </div>
                </div>
              </div>

              {/* User rating */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rate this model:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const userRating = stats?.userRating || 0;
                      return (
                        <button
                          key={rating}
                          onClick={(e) => {
                            e.stopPropagation();
                            rateModel(model.id, rating);
                          }}
                          className={`p-1 rounded ${
                            rating <= userRating
                              ? 'text-yellow-500'
                              : 'text-gray-300 hover:text-yellow-400'
                          }`}
                        >
                          <Star className="w-4 h-4" fill={rating <= userRating ? 'currentColor' : 'none'} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {stats && (
                  <div className="text-xs text-gray-500">
                    Used {stats.requestCount} times
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Settings className="w-6 h-6 text-purple-600" />
          AI Model Settings
        </h2>
        <p className="text-gray-600">
          Customize your AI experience with intelligent model selection and cost controls
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
        {[
          { id: 'models', label: 'Models', icon: Brain },
          { id: 'costs', label: 'Cost Control', icon: DollarSign },
          { id: 'usage', label: 'Usage Stats', icon: TrendingUp },
          { id: 'advanced', label: 'Advanced', icon: Settings }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === id
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {/* Models Tab */}
        {activeTab === 'models' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Quality Preference */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quality Preference</h3>
              <div className="flex gap-3">
                {[
                  { id: 'fast', label: 'Fast', desc: 'Quick responses, good quality' },
                  { id: 'balanced', label: 'Balanced', desc: 'Best mix of speed and quality' },
                  { id: 'high-quality', label: 'High Quality', desc: 'Best results, slower responses' }
                ].map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => handleQualityPreferenceChange(id as any)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      preferences.qualityPreference === id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-sm text-gray-600">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Available Models</h3>
                <div className="text-sm text-gray-600">
                  Quick Switch: {preferences.quickSwitchModels.length}/5 models
                </div>
              </div>

              <div className="grid gap-4">
                {Object.values(AI_MODELS).map((model) => {
                  const stats = modelStats.find(s => s.modelId === model.id);
                  return (
                    <ModelCard key={model.id} model={model} stats={stats} />
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Cost Control Tab */}
        {activeTab === 'costs' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Cost Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-700 font-medium">Daily Spend</span>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900">
                  ${costTracking.dailySpend.toFixed(4)}
                </div>
                <div className="text-sm text-green-600">
                  of ${costTracking.costAlerts.dailyLimit} limit
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-700 font-medium">Weekly Spend</span>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  ${costTracking.weeklySpend.toFixed(4)}
                </div>
                <div className="text-sm text-blue-600">
                  of ${costTracking.costAlerts.weeklyLimit} limit
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-700 font-medium">Total Requests</span>
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {costTracking.totalRequests}
                </div>
                <div className="text-sm text-purple-600">requests made</div>
              </div>
            </div>

            {/* Cost Controls */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Cost Limits</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Cost Per Request
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="0.1"
                      step="0.001"
                      value={preferences.maxCostPerRequest || 0.01}
                      onChange={(e) => handleCostLimitChange(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 min-w-[60px]">
                      ${(preferences.maxCostPerRequest || 0.01).toFixed(3)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Requests exceeding this cost will use fallback models
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Response Time
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="1"
                      value={preferences.maxResponseTime || 10}
                      onChange={(e) => handleResponseTimeChange(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 min-w-[60px]">
                      {preferences.maxResponseTime || 10}s
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Slower models will be avoided when possible
                  </p>
                </div>
              </div>
            </div>

            {/* Preference Toggles */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Preferences</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.preferFreeModels}
                    onChange={(e) => updatePreferences({ preferFreeModels: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Prefer free models when available</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.allowExperimental}
                    onChange={(e) => updatePreferences({ allowExperimental: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Allow experimental models</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.showCostEstimates}
                    onChange={(e) => updatePreferences({ showCostEstimates: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Show cost estimates in UI</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* Usage Stats Tab */}
        {activeTab === 'usage' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Model Usage Statistics</h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {modelStats.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No usage data yet. Start using AI features to see statistics here.</p>
                  </div>
                ) : (
                  modelStats.map((stat) => {
                    const model = AI_MODELS[stat.modelId];
                    return (
                      <div key={stat.modelId} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-gray-900">{model.name}</div>
                            {stat.userRating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                                <span className="text-sm text-gray-600">{stat.userRating}/5</span>
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Last used: {new Date(stat.lastUsed).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Requests:</span>
                            <div className="font-medium">{stat.requestCount}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Cost:</span>
                            <div className="font-medium">${stat.totalCost.toFixed(4)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Avg Response:</span>
                            <div className="font-medium">{stat.avgResponseTime.toFixed(1)}s</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Success Rate:</span>
                            <div className="font-medium">{(stat.successRate * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* UI Preferences */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Interface Preferences</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.showModelDetails}
                    onChange={(e) => updatePreferences({ showModelDetails: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Show detailed model information</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.enableAdvancedSettings}
                    onChange={(e) => updatePreferences({ enableAdvancedSettings: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Enable advanced settings</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.saveConversationHistory}
                    onChange={(e) => updatePreferences({ saveConversationHistory: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Save conversation history locally</span>
                </label>
              </div>
            </div>

            {/* Coaching Preferences */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Coaching Style</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone Preference
                  </label>
                  <select
                    value={preferences.coachingTone}
                    onChange={(e) => updatePreferences({ 
                      coachingTone: e.target.value as 'motivational' | 'technical' | 'balanced' 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="motivational">Motivational</option>
                    <option value="balanced">Balanced</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detail Level
                  </label>
                  <select
                    value={preferences.coachingFrequency}
                    onChange={(e) => updatePreferences({ 
                      coachingFrequency: e.target.value as 'minimal' | 'normal' | 'detailed' 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="minimal">Minimal</option>
                    <option value="normal">Normal</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Data Management</h3>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export Settings
                  </button>

                  <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Import Settings
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to reset all settings to defaults?')) {
                        resetToDefaults();
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset to Defaults
                  </button>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferences.allowTelemetry}
                      onChange={(e) => updatePreferences({ allowTelemetry: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      Allow anonymous usage analytics to improve the service
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}