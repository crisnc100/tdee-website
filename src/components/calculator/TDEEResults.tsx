'use client';

import { motion } from 'framer-motion';
import { TDEEResult } from '@/types/calculator';
import { Target, TrendingUp, TrendingDown, Minus, Activity, Zap } from 'lucide-react';

interface TDEEResultsProps {
  result: TDEEResult;
}

export default function TDEEResults({ result }: TDEEResultsProps) {
  const recommendations = [
    {
      label: 'Extreme Weight Loss',
      value: result.recommendation.extremeWeightLoss,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: '-750 cal/day'
    },
    {
      label: 'Weight Loss',
      value: result.recommendation.weightLoss,
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: '-500 cal/day'
    },
    {
      label: 'Mild Weight Loss',
      value: result.recommendation.mildWeightLoss,
      icon: TrendingDown,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: '-250 cal/day'
    },
    {
      label: 'Maintain Weight',
      value: result.recommendation.maintain,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Current TDEE'
    },
    {
      label: 'Mild Weight Gain',
      value: result.recommendation.mildWeightGain,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '+250 cal/day'
    },
    {
      label: 'Weight Gain',
      value: result.recommendation.weightGain,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: '+500 cal/day'
    }
  ];

  const components = [
    { label: 'Base Metabolic Rate', value: result.components.bmr, icon: Activity },
    { label: 'Muscle Factor', value: result.components.muscleFactor, icon: Zap },
    { label: 'Job Activity', value: result.components.jobActivity, icon: Target },
    { label: 'NEAT (Steps)', value: result.components.neat, icon: TrendingUp },
    { label: 'Exercise', value: result.components.exercise, icon: Activity },
    { label: 'Muscle Recovery', value: result.components.muscleRecovery, icon: Zap }
  ];

  return (
    <div className="space-y-8">
      {/* Main TDEE Result */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Your TDEE</h3>
        <div className="text-5xl font-bold result-highlight mb-2">
          {result.tdee.toLocaleString()}
        </div>
        <p className="text-lg text-gray-600">calories per day</p>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Confidence Range:</span> {result.errorMargin.lower.toLocaleString()} - {result.errorMargin.upper.toLocaleString()} calories
          </p>
        </div>
      </motion.div>

      {/* Component Breakdown */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">7-Component Breakdown</h4>
        <div className="space-y-3">
          {components.map((component, index) => (
            <motion.div
              key={component.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <component.icon className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">{component.label}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                +{component.value} cal
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Calorie Recommendations</h4>
        <div className="grid grid-cols-1 gap-3">
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                rec.label === 'Maintain Weight' 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${rec.bgColor}`}>
                  <rec.icon className={`w-4 h-4 ${rec.color}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{rec.label}</p>
                  <p className="text-xs text-gray-500">{rec.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${rec.color}`}>
                  {rec.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">cal/day</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Accuracy Note */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 bg-primary-50 rounded-lg border border-primary-200"
      >
        <h5 className="font-semibold text-primary-900 mb-2">Why This Is More Accurate</h5>
        <p className="text-sm text-primary-800">
          Unlike basic calculators that use simple activity multipliers, our formula accounts for your 
          specific job activity, daily steps, muscle mass, and recovery needs. This personalized approach 
          can be 300-500 calories more accurate than generic formulas.
        </p>
      </motion.div>
    </div>
  );
}