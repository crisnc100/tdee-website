'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MacroSplit } from '@/types/calculator';
import { calculateMacros } from '@/lib/calculator';
import { 
  Calculator, 
  Loader2, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Info,
  Clock,
  DollarSign,
  Zap,
  Brain,
  Sparkles,
  Star,
  AlertCircle
} from 'lucide-react';
import { AI_MODELS, AIModelId } from '@/types/ai';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface MacroCalculatorProps {
  defaultCalories: number;
  userData?: any;
}

export default function MacroCalculator({ defaultCalories, userData }: MacroCalculatorProps) {
  const [targetCalories, setTargetCalories] = useState(defaultCalories);
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [isManualCalories, setIsManualCalories] = useState(false);
  const [macros, setMacros] = useState<MacroSplit[]>([]);
  const [recommended, setRecommended] = useState(0);
  const [message, setMessage] = useState('');
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProteinInfo, setShowProteinInfo] = useState(false);
  
  // AI Performance Indicators
  const [aiPerformance, setAiPerformance] = useState<{
    modelUsed?: AIModelId;
    responseTime?: number;
    estimatedCost?: number;
    confidence?: number;
    usedFallback?: boolean;
  }>({});
  
  const { preferences, trackModelUsage } = useUserPreferences();

  // Auto-adjust calories when goal changes (unless user manually overrode)
  const handleGoalChange = (newGoal: 'lose' | 'maintain' | 'gain') => {
    setGoal(newGoal);
    
    if (!isManualCalories) {
      let adjustedCalories = defaultCalories;
      switch (newGoal) {
        case 'lose':
          adjustedCalories = defaultCalories - 500;
          break;
        case 'maintain':
          adjustedCalories = defaultCalories;
          break;
        case 'gain':
          adjustedCalories = defaultCalories + 500;
          break;
      }
      setTargetCalories(Math.max(1200, adjustedCalories)); // Minimum 1200 calories
    }
  };

  const handleCaloriesChange = (newCalories: number) => {
    setTargetCalories(newCalories);
    setIsManualCalories(true); // Mark as manually set
  };

  const handleCalculate = () => {
    setLoading(true);
    
    // Calculate macros locally - no API call needed!
    const macroTypes: MacroSplit['type'][] = ['balanced', 'low_carb', 'high_carb', 'keto'];
    const calculatedMacros = macroTypes.map(type => calculateMacros(targetCalories, type));
    
    // Smart recommendation - always balanced, protein is key!
    let recommendedIndex = 0; // Always recommend balanced
    
    // Generate personalized message - concise
    const messages = {
      lose: `Balanced macros with ${calculatedMacros[0].protein.grams}g protein to preserve muscle while losing fat.`,
      maintain: `Balanced approach with ${calculatedMacros[0].protein.grams}g protein for optimal body composition.`,
      gain: `Balanced macros with ${calculatedMacros[0].protein.grams}g protein to support muscle growth.`
    };
    
    // Generate insights based on goal - focus on protein
    const insightsList = {
      lose: [
        'Aim for 0.8-1g protein per pound bodyweight',
        'Keep carbs moderate for energy',
        'Focus on whole foods for satiety'
      ],
      maintain: [
        'Maintain 0.8g protein per pound minimum',
        'Balance carbs and fats by preference',
        'Stay consistent with tracking'
      ],
      gain: [
        'Target 1g protein per pound bodyweight',
        'Higher carbs fuel training',
        'Don\'t drop fats below 20%'
      ]
    };
    
    setMacros(calculatedMacros);
    setRecommended(recommendedIndex);
    setMessage(messages[goal]);
    setInsights(insightsList[goal]);
    
    // Set dummy AI performance for UI compatibility
    setAiPerformance({
      modelUsed: 'local' as AIModelId,
      responseTime: 10,
      estimatedCost: 0,
      confidence: 1,
      usedFallback: false
    });
    
    setLoading(false);
  };

  const goalIcons = {
    lose: TrendingDown,
    maintain: Target,
    gain: TrendingUp
  };

  const goalColors = {
    lose: 'text-red-600 bg-red-50 border-red-200',
    maintain: 'text-green-600 bg-green-50 border-green-200',
    gain: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Macro Calculator
          </h3>
          
         
        </div>
        
        <p className="text-sm text-gray-600">
          Get personalized macro splits!
        </p>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Calories
          </label>
          <input
            type="number"
            value={targetCalories}
            onChange={(e) => handleCaloriesChange(parseInt(e.target.value))}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            min="800"
            max="5000"
          />
          <p className="text-xs text-gray-500 mt-1">
            {isManualCalories ? 
              "Custom calories set" : 
              `Auto-adjusted from ${defaultCalories} maintenance calories`
            }
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Goal
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['lose', 'maintain', 'gain'] as const).map((option) => {
              const Icon = goalIcons[option];
              return (
                <button
                  key={option}
                  onClick={() => handleGoalChange(option)}
                  className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${
                    goal === option
                      ? goalColors[option]
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium capitalize">{option}</span>
                  {option === 'lose' && <span className="text-xs text-gray-500">-500 cal</span>}
                  {option === 'gain' && <span className="text-xs text-gray-500">+500 cal</span>}
                </button>
              );
            })}
          </div>
        </div>

        <motion.button
          onClick={handleCalculate}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4" />
              Calculate Macros
            </>
          )}
        </motion.button>
      </div>

      {/* Results */}
      {macros.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {message && (
            <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-start gap-2">
                <Brain className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-primary-800">{message}</p>
               
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {macros.map((macro, index) => (
              <motion.div
                key={macro.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-2 ${
                  index === recommended
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 capitalize flex items-center gap-2">
                    {macro.type.replace('_', ' ')}
                    {index === recommended && (
                      <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded-full font-medium shadow-sm">
                        Recommended
                      </span>
                    )}
                  </h4>
                  <span className="text-sm text-gray-600">{macro.calories} cal</span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="relative">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-lg font-bold text-gray-900">{macro.protein.grams}g</p>
                      {index === 0 && (
                        <button
                          onClick={() => setShowProteinInfo(!showProteinInfo)}
                          className="text-gray-400 hover:text-orange-600 transition-colors"
                        >
                          <Info className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">Protein ({macro.protein.percentage}%)</p>
                    
                    {/* Protein Info Tooltip - Only for first macro */}
                    {showProteinInfo && index === 0 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-white rounded-lg shadow-xl border border-gray-200 z-10 text-left">
                        <button 
                          onClick={() => setShowProteinInfo(false)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                        <h5 className="font-semibold text-gray-900 mb-2 text-sm">Protein Guidelines</h5>
                        <div className="space-y-1 text-xs text-gray-700">
                          <p>• <strong>Minimum:</strong> 0.8g per lb bodyweight</p>
                          <p>• <strong>Optimal:</strong> 1g per lb for satiety</p>
                          <p>• <strong>Weight Loss:</strong> Higher protein preserves muscle</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{macro.carbs.grams}g</p>
                    <p className="text-xs text-gray-600">Carbs ({macro.carbs.percentage}%)</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{macro.fats.grams}g</p>
                    <p className="text-xs text-gray-600">Fats ({macro.fats.percentage}%)</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </motion.div>
      )}
    </div>
  );
}