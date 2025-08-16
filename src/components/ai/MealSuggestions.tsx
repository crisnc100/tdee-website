'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MealSuggestion } from '@/types/calculator';
import { ChefHat, Clock, Star, Loader2 } from 'lucide-react';

interface MealSuggestionsProps {
  defaultCalories: number;
}

export default function MealSuggestions({ defaultCalories }: MealSuggestionsProps) {
  const [targetCalories, setTargetCalories] = useState(Math.round(defaultCalories / 4)); // Quarter of daily calories
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGetSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetCalories, 
          goal,
          dietaryPreferences: [] 
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Failed to get meal suggestions:', error);
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
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <ChefHat className="w-5 h-5" />
          Meal Suggestions
        </h3>
        <p className="text-sm text-gray-600">
          Get personalized meal ideas based on your calorie target
        </p>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Calories for This Meal
          </label>
          <input
            type="number"
            value={targetCalories}
            onChange={(e) => setTargetCalories(parseInt(e.target.value))}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            min="100"
            max="1500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Suggested: {Math.round(defaultCalories / 4)} cal (1/4 of daily TDEE)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  {option === 'lose' && '250-400 cal'}
                  {option === 'maintain' && '400-600 cal'}
                  {option === 'gain' && '600-800 cal'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <motion.button
          onClick={handleGetSuggestions}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Finding meals...
            </>
          ) : (
            <>
              <ChefHat className="w-4 h-4" />
              Get Meal Ideas
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
              <p className="text-sm text-orange-800">{message}</p>
            </div>
          )}

          <div className="space-y-4">
            {suggestions.map((meal, index) => (
              <motion.div
                key={`${meal.name}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
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
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}