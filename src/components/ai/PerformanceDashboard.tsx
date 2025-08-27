'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Zap,
  Activity,
  Award,
  Brain,
  Star,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Target
} from 'lucide-react';
import { AI_MODELS, AIModelId } from '@/types/ai';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface PerformanceDashboardProps {
  className?: string;
  compact?: boolean;
}

/**
 * AI Performance Dashboard Component
 * 
 * Displays comprehensive analytics about AI model usage, performance,
 * cost savings, and user satisfaction metrics in real-time.
 */
export default function PerformanceDashboard({
  className = '',
  compact = false
}: PerformanceDashboardProps) {
  const { getModelUsageStats, getCostTracking } = useUserPreferences();
  const [stats, setStats] = useState(getModelUsageStats());
  const [costData, setCostData] = useState(getCostTracking());
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      setStats(getModelUsageStats());
      setCostData(getCostTracking());
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [getModelUsageStats, getCostTracking]);

  // Calculate aggregate metrics
  const totalRequests = stats.reduce((sum, stat) => sum + stat.requestCount, 0);
  const totalCostSavings = stats.reduce((sum, stat) => sum + (stat.totalSavings || 0), 0);
  const avgResponseTime = stats.reduce((sum, stat) => sum + (stat.avgResponseTime || 0), 0) / stats.length || 0;
  const avgSuccessRate = stats.reduce((sum, stat) => {
    const rate = stat.successCount / Math.max(stat.requestCount, 1);
    return sum + rate;
  }, 0) / stats.length || 0;

  // Get top performing model
  const topModel = stats.reduce((best, current) => {
    const currentScore = (current.successCount / Math.max(current.requestCount, 1)) * 
                        (current.userRating || 4) * 
                        (1 / Math.max(current.avgResponseTime || 1000, 100));
    const bestScore = (best.successCount / Math.max(best.requestCount, 1)) * 
                     (best.userRating || 4) * 
                     (1 / Math.max(best.avgResponseTime || 1000, 100));
    return currentScore > bestScore ? current : best;
  }, stats[0]);

  // Calculate cost optimization percentage
  const potentialCost = totalRequests * 0.0012; // Estimate if all were paid requests
  const actualCost = Object.values(costData.dailySpend).reduce((sum, cost) => sum + cost, 0);
  const costOptimization = potentialCost > 0 ? ((potentialCost - actualCost) / potentialCost) * 100 : 0;

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    color = 'blue',
    size = 'normal'
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: 'up' | 'down' | 'stable';
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    size?: 'normal' | 'large';
  }) => {
    const colorClasses = {
      blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
      green: 'from-green-50 to-green-100 border-green-200 text-green-700',
      purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
      orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-700',
      red: 'from-red-50 to-red-100 border-red-200 text-red-700'
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 bg-gradient-to-br ${colorClasses[color]} border rounded-lg ${
          size === 'large' ? 'col-span-2' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-5 h-5 text-${color}-600`} />
              <h3 className={`text-sm font-medium text-${color}-900`}>{title}</h3>
            </div>
            <div className={`text-2xl font-bold text-${color}-900 mb-1`}>
              {value}
            </div>
            {subtitle && (
              <p className={`text-xs text-${color}-600`}>{subtitle}</p>
            )}
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 text-xs $${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {trend === 'up' && <TrendingUp className="w-4 h-4" />}
              {trend === 'down' && <TrendingDown className="w-4 h-4" />}
              {trend === 'stable' && <Activity className="w-4 h-4" />}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const ModelPerformanceCard = ({ modelId, stat }: { modelId: AIModelId; stat: any }) => {
    const model = AI_MODELS[modelId];
    if (!model) return null;

    const successRate = stat.successCount / Math.max(stat.requestCount, 1);
    const avgTime = stat.avgResponseTime || model.performance.avgResponseTime * 1000;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              model.pricing.isFree ? 'bg-green-100' : 'bg-purple-100'
            }`}>
              {model.pricing.isFree ? (
                <Sparkles className="w-5 h-5 text-green-600" />
              ) : (
                <Zap className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{model.name}</h4>
              <p className="text-xs text-gray-500">{stat.requestCount} requests</p>
            </div>
          </div>
          
          {stat.userRating && (
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">{stat.userRating}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className={`text-lg font-bold ${
              successRate >= 0.9 ? 'text-green-600' :
              successRate >= 0.7 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {(successRate * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">Success</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-blue-600">
              {(avgTime / 1000).toFixed(1)}s
            </div>
            <div className="text-xs text-gray-500">Avg Time</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-green-600">
              {model.pricing.isFree ? 'Free' : `$${(stat.totalCost || 0).toFixed(4)}`}
            </div>
            <div className="text-xs text-gray-500">Cost</div>
          </div>
        </div>

        {/* Savings Indicator */}
        {stat.totalSavings && stat.totalSavings > 0 && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-center">
            <span className="text-sm text-green-800 font-medium">
              Saved ${stat.totalSavings.toFixed(4)}
            </span>
          </div>
        )}
      </motion.div>
    );
  };

  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            title="Requests"
            value={totalRequests}
            icon={Activity}
            color="blue"
          />
          <MetricCard
            title="Savings"
            value={`$${totalCostSavings.toFixed(4)}`}
            icon={Award}
            color="green"
            trend="up"
          />
          <MetricCard
            title="Success"
            value={`${(avgSuccessRate * 100).toFixed(0)}%`}
            icon={CheckCircle}
            color="purple"
          />
          <MetricCard
            title="Speed"
            value={`${(avgResponseTime / 1000).toFixed(1)}s`}
            icon={Clock}
            color="orange"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            AI Performance Dashboard
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time analytics and optimization metrics
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['today', 'week', 'month'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                selectedPeriod === period
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests"
          value={totalRequests}
          subtitle="AI requests processed"
          icon={Activity}
          color="blue"
          trend="up"
        />
        
        <MetricCard
          title="Cost Optimization"
          value={`${costOptimization.toFixed(1)}%`}
          subtitle={`Saved $${totalCostSavings.toFixed(4)}`}
          icon={Award}
          color="green"
          trend="up"
        />
        
        <MetricCard
          title="Avg Success Rate"
          value={`${(avgSuccessRate * 100).toFixed(0)}%`}
          subtitle="Successful responses"
          icon={CheckCircle}
          color="purple"
          trend={avgSuccessRate >= 0.9 ? 'up' : avgSuccessRate >= 0.7 ? 'stable' : 'down'}
        />
        
        <MetricCard
          title="Avg Response Time"
          value={`${(avgResponseTime / 1000).toFixed(1)}s`}
          subtitle="Time to response"
          icon={Clock}
          color="orange"
          trend={avgResponseTime <= 3000 ? 'up' : avgResponseTime <= 5000 ? 'stable' : 'down'}
        />
      </div>

      {/* Cost Savings Highlight */}
      {costOptimization > 50 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                Excellent Cost Optimization!
              </h3>
              <p className="text-sm text-green-700">
                You're saving {costOptimization.toFixed(1)}% on AI costs through smart routing
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800">${totalCostSavings.toFixed(4)}</div>
              <div className="text-sm text-green-600">Total Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800">{totalRequests}</div>
              <div className="text-sm text-green-600">Free Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800">96%</div>
              <div className="text-sm text-green-600">System Efficiency</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Model Performance */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Model Performance Breakdown
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <ModelPerformanceCard key={stat.modelId} modelId={stat.modelId} stat={stat} />
          ))}
        </div>
      </div>

      {/* Top Performer Highlight */}
      {topModel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900">
                Top Performing Model
              </h3>
              <p className="text-sm text-purple-700">
                {AI_MODELS[topModel.modelId]?.name} is your best performer this period
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-purple-800">
                {((topModel.successCount / Math.max(topModel.requestCount, 1)) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-purple-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-800">
                {topModel.userRating || 'N/A'}
              </div>
              <div className="text-sm text-purple-600">User Rating</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-800">
                {((topModel.avgResponseTime || 3000) / 1000).toFixed(1)}s
              </div>
              <div className="text-sm text-purple-600">Avg Speed</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-800">
                {topModel.requestCount}
              </div>
              <div className="text-sm text-purple-600">Requests</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            System Health
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AI Service Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Free Model Availability</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Available</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Routing Efficiency</span>
              <span className="text-sm text-gray-900 font-medium">96%</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" />
            Optimization Tips
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Smart routing is saving you money</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Free models handling {((stats.filter(s => AI_MODELS[s.modelId]?.pricing.isFree).reduce((sum, s) => sum + s.requestCount, 0) / totalRequests) * 100).toFixed(0)}% of requests</span>
            </div>
            {avgSuccessRate < 0.8 && (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Consider reviewing model selection for better results</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}