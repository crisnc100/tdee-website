'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { filterMealsByRange } from '@/lib/mealDatabase';
import { ChefHat, Clock } from 'lucide-react';

interface MealSuggestionsProps { defaultCalories: number }

export default function MealSuggestions({ defaultCalories }: MealSuggestionsProps) {
  // Four simple ranges covering the whole database
  type RangeKey = 'all' | 'light' | 'medium' | 'hearty';
  const ranges: Record<RangeKey, { label: string; min: number; max: number }> = {
    all: { label: 'All', min: 0, max: 100000 },
    light: { label: '≤ 350', min: 0, max: 350 },
    medium: { label: '350–550', min: 351, max: 550 },
    hearty: { label: '550–800', min: 551, max: 800 },
  };
  const [selected, setSelected] = useState<RangeKey>('medium');

  const suggestions = useMemo(() => {
    const r = ranges[selected];
    return filterMealsByRange({ minCalories: r.min, maxCalories: r.max });
  }, [selected]);

  // Pagination
  const pageSize = 12;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(suggestions.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return suggestions.slice(start, start + pageSize);
  }, [suggestions, page]);

  const resultsRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setPage(1); }, [selected]);
  useEffect(() => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page, selected]);

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
            Meals by Calories
          </h3>
        </div>
        <p className="text-sm text-gray-700">Pick a range. Browse all meals that fit.</p>
      </div>

      {/* Range Selector */}
      <div className="flex flex-wrap gap-2 justify-center">
        {(['all', 'light', 'medium', 'hearty'] as RangeKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            className={`px-4 py-2 rounded-full text-sm border-2 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 ${
              selected === key ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {ranges[key].label}
          </button>
        ))}
      </div>

      {/* Results */}
      {suggestions.length > 0 && (
        <motion.div ref={resultsRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="space-y-4">
            {paginated.map((meal, index) => (
              <motion.div key={`${meal.name}-${index}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-5">
                  <div className="flex gap-4 mb-4">
                    {meal.image && (
                      <div className="relative w-32 h-32 flex-shrink-0">
                        <Image src={meal.image} alt={meal.name} fill className="object-cover rounded-lg" sizes="128px" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{meal.name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{meal.prepTime} min</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(meal.difficulty)}`}>{meal.difficulty}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-600">{meal.calories}</div>
                          <div className="text-xs text-gray-500">calories</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center"><div className="font-semibold text-gray-900">{meal.protein}g</div><div className="text-xs text-gray-600">Protein</div></div>
                    <div className="text-center"><div className="font-semibold text-gray-900">{meal.carbs}g</div><div className="text-xs text-gray-600">Carbs</div></div>
                    <div className="text-center"><div className="font-semibold text-gray-900">{meal.fats}g</div><div className="text-xs text-gray-600">Fats</div></div>
                  </div>

                  <div className="mb-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Ingredients:</h5>
                    <div className="flex flex-wrap gap-1">
                      {meal.ingredients.map((ingredient, i) => (<span key={i} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">{ingredient}</span>))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Instructions:</h5>
                    <ol className="text-sm text-gray-700 space-y-1">
                      {meal.instructions.map((instruction, i) => (
                        <li key={i} className="flex gap-2"><span className="font-medium text-orange-600 min-w-[20px]">{i + 1}.</span><span>{instruction}</span></li>
                      ))}
                    </ol>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-2 rounded border text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 ${page === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'}`}
            >
              Prev
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`px-3 py-2 rounded border text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 ${page >= totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'}`}
            >
              Next
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
}
