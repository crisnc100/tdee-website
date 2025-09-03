'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { MealSuggestion } from '@/types/calculator';
import { 
  ChefHat, 
  Clock, 
  Star, 
  Loader2,
  DollarSign,
  Zap,
  Brain,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Shield
} from 'lucide-react';
import { AI_MODELS, AIModelId } from '@/types/ai';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface MealSuggestionsProps {
  defaultCalories: number;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type PortionSize = 'small' | 'medium' | 'large';

export default function MealSuggestions({ defaultCalories }: MealSuggestionsProps) {
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [portionSize, setPortionSize] = useState<PortionSize>('medium');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualCalories, setManualCalories] = useState(Math.round(defaultCalories / 4));
  
  // AI Performance & Cost Tracking
  const [aiMetrics, setAiMetrics] = useState<{
    modelUsed?: AIModelId;
    responseTime?: number;
    estimatedCost?: number;
    usedFallback?: boolean;
    totalSavings?: number;
  }>({});
  
  const { preferences, trackModelUsage } = useUserPreferences();

  // Calculate target calories based on meal type and portion size
  const getTargetCalories = () => {
    if (showAdvanced) return manualCalories;
    
    const mealCalorieMap = {
      breakfast: { small: 300, medium: 400, large: 500 },
      lunch: { small: 400, medium: 500, large: 600 },
      dinner: { small: 450, medium: 550, large: 650 },
      snack: { small: 200, medium: 300, large: 400 }
    };
    
    return mealCalorieMap[mealType][portionSize];
  };

  const handleGetSuggestions = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const targetCalories = getTargetCalories();
      const response = await fetch('/api/ai/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetCalories, 
          goal,
          mealType,
          dietaryPreferences: [],
          userPreferences: preferences
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
        setMessage(data.message);
        
        // Track AI performance and cost metrics
        const responseTime = Date.now() - startTime;
        const metrics = {
          modelUsed: data.modelUsed,
          responseTime,
          estimatedCost: data.estimatedCost || 0,
          usedFallback: data.usedFallback || false,
          totalSavings: data.totalSavings || 0
        };
        setAiMetrics(metrics);
        
        // Track usage for cost analytics
        if (data.modelUsed) {
          trackModelUsage(data.modelUsed, responseTime, data.estimatedCost || 0, true);
        }
      }
    } catch (error) {
      console.error('Failed to get meal suggestions:', error);
      
      // Track failed attempt
      const responseTime = Date.now() - startTime;
      setAiMetrics({
        responseTime,
        usedFallback: true,
        estimatedCost: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Meal Planner
          </h3>
          
          {/* Cost Transparency & Performance Indicators */}
          {aiMetrics.modelUsed && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                aiMetrics.usedFallback 
                  ? 'bg-orange-100 text-orange-700'
                  : AI_MODELS[aiMetrics.modelUsed]?.pricing.isFree
                    ? 'bg-green-100 text-green-700'
                    : 'bg-purple-100 text-purple-700'
              }`}>
                {aiMetrics.usedFallback ? (
                  <AlertCircle className="w-3 h-3" />
                ) : AI_MODELS[aiMetrics.modelUsed]?.pricing.isFree ? (
                  <Sparkles className="w-3 h-3" />
                ) : (
                  <Zap className="w-3 h-3" />
                )}
                {aiMetrics.usedFallback 
                  ? 'Smart Fallback'
                  : AI_MODELS[aiMetrics.modelUsed]?.name
                }
              </div>
              
              {/* Cost Transparency */}
              {preferences.showCostEstimates && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  <DollarSign className="w-3 h-3" />
                  {(aiMetrics.estimatedCost || 0) === 0 ? 'Free' : `$${(aiMetrics.estimatedCost || 0).toFixed(4)}`}
                  {aiMetrics.totalSavings && aiMetrics.totalSavings > 0 && (
                    <span className="ml-1 font-medium">
                      (Saved ${aiMetrics.totalSavings.toFixed(4)})
                    </span>
                  )}
                </div>
              )}
              
              {aiMetrics.responseTime && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  <Clock className="w-3 h-3" />
                  {(aiMetrics.responseTime / 1000).toFixed(1)}s
                </div>
              )}
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-600">
          Meal planning with custom recipes and recommendations!
        </p>
        
        {/* Cost Savings Banner */}
        {preferences.showCostEstimates && aiMetrics.totalSavings && aiMetrics.totalSavings > 0 && (
          <div className="mt-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-green-800">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">
                Smart routing saved you ${aiMetrics.totalSavings.toFixed(4)} this request
              </span>
              <Shield className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="space-y-5">
        {/* Meal Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What type of meal are you looking for?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: 'breakfast', label: 'Breakfast', emoji: '🌅' },
              { id: 'lunch', label: 'Lunch', emoji: '☀️' },
              { id: 'dinner', label: 'Dinner', emoji: '🌙' },
              { id: 'snack', label: 'Snack', emoji: '🍎' }
            ] as const).map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => setMealType(id)}
                className={`p-3 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                  mealType === id
                    ? 'border-orange-300 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{emoji}</span>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Portion Size Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How hungry are you?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { id: 'small', label: 'Light', calories: getTargetCalories.bind(null)()?.toString().includes('small') ? 
                (mealType === 'breakfast' ? '~300' : mealType === 'lunch' ? '~400' : mealType === 'dinner' ? '~450' : '~200') : '' },
              { id: 'medium', label: 'Satisfying', calories: '' },
              { id: 'large', label: 'Very Hungry', calories: '' }
            ] as const).map(({ id, label }) => {
              const calorieRanges = {
                breakfast: { small: '~300', medium: '~400', large: '~500' },
                lunch: { small: '~400', medium: '~500', large: '~600' },
                dinner: { small: '~450', medium: '~550', large: '~650' },
                snack: { small: '~200', medium: '~300', large: '~400' }
              };
              
              return (
                <button
                  key={id}
                  onClick={() => setPortionSize(id as PortionSize)}
                  className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-1 ${
                    portionSize === id
                      ? 'border-orange-300 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-gray-500">
                    {calorieRanges[mealType][id as PortionSize]} cal
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Goal Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Your Goal
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['lose', 'maintain', 'gain'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setGoal(option)}
                className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-1 ${
                  goal === option
                    ? 'border-orange-300 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-sm font-medium capitalize">{option}</span>
                <span className="text-xs text-gray-500">
                  {option === 'lose' && 'High protein'}
                  {option === 'maintain' && 'Balanced'}
                  {option === 'gain' && 'Calorie dense'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div className="border-t pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-600 hover:text-orange-600 flex items-center gap-2"
          >
            <span>Advanced options</span>
            <span className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          {showAdvanced && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Calories (Manual)
              </label>
              <input
                type="number"
                value={manualCalories}
                onChange={(e) => setManualCalories(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                min="100"
                max="1500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Override automatic calculation with custom calories
              </p>
            </div>
          )}
        </div>

        <motion.button
          onClick={handleGetSuggestions}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Finding meals...
            </>
          ) : (
            <>
              <ChefHat className="w-4 h-4" />
              Find Perfect Meals
            </>
          )}
        </motion.button>
      </div>

      {/* Results */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {message && (
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-start gap-2">
                <Brain className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-orange-800">{message}</p>
                  
                  {/* AI Attribution */}
                  {aiMetrics.modelUsed && !aiMetrics.usedFallback && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-orange-700">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Generated by {AI_MODELS[aiMetrics.modelUsed]?.name}
                      </span>
                      
                      {aiMetrics.responseTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {(aiMetrics.responseTime / 1000).toFixed(1)}s response
                        </span>
                      )}
                      
                      {preferences.showCostEstimates && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {(aiMetrics.estimatedCost || 0) === 0 ? 'Free tier' : `$${(aiMetrics.estimatedCost || 0).toFixed(4)} cost`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {suggestions.map((meal, index) => (
              <motion.div
                key={`${meal.name}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative"
              >
                {/* AI Quality Indicator */}
                {!aiMetrics.usedFallback && aiMetrics.modelUsed && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      AI_MODELS[aiMetrics.modelUsed]?.pricing.isFree
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      <Brain className="w-3 h-3" />
                      AI
                    </div>
                  </div>
                )}
                <div className="p-5">
                  {/* Header with Image and Title */}
                  <div className="flex gap-4 mb-4">
                    {/* Compact Image */}
                    {meal.image && meal.image.length > 0 && (
                      <div className="relative w-32 h-32 flex-shrink-0">
                        <Image
                          src={meal.image}
                          alt={meal.name}
                          fill
                          className="object-cover rounded-lg"
                          sizes="128px"
                        />
                      </div>
                    )}
                    
                    {/* Title and Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{meal.name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {meal.prepTime} min
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(meal.difficulty)}`}>
                              {meal.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-600">{meal.calories}</div>
                          <div className="text-xs text-gray-500">calories</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Macros */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{meal.protein}g</div>
                      <div className="text-xs text-gray-600">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{meal.carbs}g</div>
                      <div className="text-xs text-gray-600">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{meal.fats}g</div>
                      <div className="text-xs text-gray-600">Fats</div>
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div className="mb-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Ingredients:</h5>
                    <div className="flex flex-wrap gap-1">
                      {meal.ingredients.map((ingredient, i) => (
                        <span
                          key={i}
                          className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Instructions:</h5>
                    <ol className="text-sm text-gray-700 space-y-1">
                      {meal.instructions.map((instruction, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="font-medium text-orange-600 min-w-[20px]">{i + 1}.</span>
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                
                {/* Performance Footer for First Meal */}
                {index === 0 && aiMetrics.modelUsed && (
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {aiMetrics.usedFallback ? 'Smart Analysis' : `Powered by ${AI_MODELS[aiMetrics.modelUsed]?.name}`}
                        </span>
                        
                        {aiMetrics.responseTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {(aiMetrics.responseTime / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                      
                      {preferences.showCostEstimates && (
                        <div className="flex items-center gap-1 text-green-600">
                          <DollarSign className="w-3 h-3" />
                          {(aiMetrics.estimatedCost || 0) === 0 ? 'Free' : `$${(aiMetrics.estimatedCost || 0).toFixed(4)}`}
                          {aiMetrics.totalSavings && aiMetrics.totalSavings > 0 && (
                            <span className="text-green-700 font-medium ml-1">
                              (Saved ${aiMetrics.totalSavings.toFixed(4)})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}