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
      subtitle: '(7-Component Formula)',
      value: comparison.ourCalculator,
      difference: 0,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      isOurs: true
    },
    {
      name: 'MyFitnessPal',
      subtitle: '(Mifflin-St Jeor)',
      value: comparison.myFitnessPal,
      difference: comparison.difference.myFitnessPal,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      isOurs: false
    },
    {
      name: 'Calculator.net',
      subtitle: '(Mifflin-St Jeor)',
      value: comparison.calculatorNet,
      difference: comparison.difference.calculatorNet,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      isOurs: false
    },
    {
      name: 'Sailrabbit',
      subtitle: '(Multi-Formula Avg)',
      value: comparison.sailrabbit,
      difference: comparison.difference.sailrabbit,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      isOurs: false
    },
    {
      name: 'TDEE Calculator',
      subtitle: '(Mifflin-St Jeor)',
      value: comparison.tdeeCalculatorNet,
      difference: comparison.difference.tdeeCalculatorNet,
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
        className="p-5 bg-gradient-to-r from-primary-50 to-amber-50 rounded-xl border border-primary-200"
      >
        <h4 className="font-semibold text-primary-900 mb-3">Formula Comparison & Accuracy</h4>
        <div className="space-y-3 text-sm text-primary-800">
          <div className="flex gap-3">
            <span className="font-semibold min-w-[140px]">Standard Calculators:</span>
            <span>Use BMR × activity multiplier (1.2-1.9) only</span>
          </div>
          <div className="flex gap-3">
            <span className="font-semibold min-w-[140px]">Sailrabbit Approach:</span>
            <span>Averages multiple BMR formulas for better accuracy</span>
          </div>
          <div className="flex gap-3">
            <span className="font-semibold min-w-[140px]">Our 7-Component:</span>
            <span>BMR + NEAT (steps) + EAT (exercise) + TEF + job activity + muscle mass + metabolic adaptation</span>
          </div>
          <div className="flex gap-3 pt-2 border-t border-primary-200">
            <span className="font-semibold min-w-[140px]">Average Difference:</span>
            <span>
              {Math.round(
                (Math.abs(comparison.difference.myFitnessPal) + 
                 Math.abs(comparison.difference.calculatorNet) + 
                 Math.abs(comparison.difference.sailrabbit) + 
                 Math.abs(comparison.difference.tdeeCalculatorNet)) / 4
              )} calories/day = {' '}
              {(
                ((Math.abs(comparison.difference.myFitnessPal) + 
                  Math.abs(comparison.difference.calculatorNet) + 
                  Math.abs(comparison.difference.sailrabbit) + 
                  Math.abs(comparison.difference.tdeeCalculatorNet)) / 4) * 30 / 3500
              ).toFixed(1)} lbs/month impact
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}