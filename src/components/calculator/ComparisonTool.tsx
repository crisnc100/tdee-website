'use client';

import { motion } from 'framer-motion';
import { UserData } from '@/types/calculator';
import { calculateComparison } from '@/lib/calculator';
import { BarChart3, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface ComparisonToolProps {
  userData: UserData;
  ourResult: number;
}

export default function ComparisonTool({ userData, ourResult }: ComparisonToolProps) {
  const comparison = calculateComparison(userData);

  const calculators = [
    {
      name: 'CalorieScope',
      subtitle: '(Our Formula)',
      value: comparison.ourCalculator,
      difference: 0,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      isOurs: true
    },
    {
      name: 'Calculator.net',
      subtitle: '(Basic Multiplier)',
      value: comparison.calculatorNet,
      difference: comparison.difference.calculatorNet,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      isOurs: false
    },
    {
      name: 'MyFitnessPal',
      subtitle: '(Conservative)',
      value: comparison.myFitnessPal,
      difference: comparison.difference.myFitnessPal,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      isOurs: false
    }
  ];

  const getDifferenceIcon = (diff: number) => {
    if (diff > 0) return TrendingUp;
    if (diff < 0) return TrendingDown;
    return Target;
  };

  const getDifferenceColor = (diff: number) => {
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <h3 className="text-xl font-bold text-gray-900">Calculator Comparison</h3>
        </div>
        <p className="text-sm text-gray-600">
          See how our precision formula compares to other popular calculators
        </p>
      </div>

      <div className="space-y-4">
        {calculators.map((calc, index) => {
          const DifferenceIcon = getDifferenceIcon(calc.difference);
          
          return (
            <motion.div
              key={calc.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-5 rounded-xl border-2 ${calc.borderColor} ${calc.bgColor} ${
                calc.isOurs ? 'ring-2 ring-primary-200' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-bold ${calc.color}`}>{calc.name}</h4>
                  <p className="text-xs text-gray-500">{calc.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${calc.color}`}>
                    {calc.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">cal/day</p>
                </div>
              </div>

              {!calc.isOurs && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Difference from our calculator:</span>
                    <div className={`flex items-center gap-1 ${getDifferenceColor(calc.difference)}`}>
                      <DifferenceIcon className="w-4 h-4" />
                      <span className="font-semibold">
                        {calc.difference > 0 ? '+' : ''}{calc.difference} cal
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-5 bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl border border-primary-200"
      >
        <h4 className="font-semibold text-primary-900 mb-3">Why The Difference Matters</h4>
        <div className="space-y-3 text-sm text-primary-800">
          <div className="flex gap-3">
            <span className="font-semibold min-w-[80px]">Basic Calculators:</span>
            <span>Use simple activity level multipliers (1.2x, 1.5x, etc.)</span>
          </div>
          <div className="flex gap-3">
            <span className="font-semibold min-w-[80px]">Our Formula:</span>
            <span>Accounts for job activity, steps, muscle mass, and recovery needs</span>
          </div>
          <div className="flex gap-3">
            <span className="font-semibold min-w-[80px]">Impact:</span>
            <span>
              {Math.abs(comparison.difference.calculatorNet)} calorie difference = 
              {' '}{(Math.abs(comparison.difference.calculatorNet) * 7 / 3500).toFixed(1)} lbs 
              per month if following wrong target
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}