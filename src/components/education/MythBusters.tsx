'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, X, Info } from 'lucide-react';

interface Myth {
  myth: string;
  truth: string;
  explanation: string;
  impact: 'high' | 'medium' | 'low';
}

const myths: Myth[] = [
  {
    myth: "1200 calories is the magic number for weight loss",
    truth: "Most adults need significantly more than 1200 calories",
    explanation: "1200 calories is below the BMR for most adults. Eating this little can slow metabolism, cause muscle loss, and lead to nutrient deficiencies. Your actual needs depend on age, size, and activity level.",
    impact: "high"
  },
  {
    myth: "Starvation mode will stop weight loss completely",
    truth: "Metabolic adaptation is real but doesn't stop weight loss",
    explanation: "While your metabolism does slow with extreme calorie restriction (by 10-15%), it doesn't stop. The real issue is that extreme restriction is unsustainable and often leads to binge eating.",
    impact: "high"
  },
  {
    myth: "Eating after 8 PM causes weight gain",
    truth: "Total daily calories matter, not meal timing",
    explanation: "Your body doesn't have a clock that makes calories count more at night. Weight gain happens from consistently eating more calories than you burn, regardless of when you eat them.",
    impact: "medium"
  },
  {
    myth: "You must eat 6 small meals to boost metabolism",
    truth: "Meal frequency doesn't significantly affect metabolism",
    explanation: "TEF (Thermic Effect of Food) is based on total food intake, not frequency. Whether you eat 3 meals or 6, if calories are equal, the metabolic effect is the same.",
    impact: "medium"
  },
  {
    myth: "Muscle weighs more than fat",
    truth: "Muscle is denser than fat, not heavier",
    explanation: "A pound is a pound. But muscle takes up about 20% less space than fat, which is why you can look leaner at the same weight with more muscle mass.",
    impact: "low"
  },
  {
    myth: "Cardio is the best way to lose weight",
    truth: "Diet controls weight loss; exercise improves body composition",
    explanation: "You can't outrun a bad diet. A 30-minute run burns ~300 calories - easily undone by one pastry. Weight training preserves muscle during weight loss, leading to better results.",
    impact: "high"
  },
  {
    myth: "Women will get bulky from lifting weights",
    truth: "Women lack the testosterone to build large muscles easily",
    explanation: "Women have 15-20x less testosterone than men. Building significant muscle requires years of training and often intentional bulking. Weight training creates a 'toned' look most women want.",
    impact: "high"
  },
  {
    myth: "You need to cut carbs to lose fat",
    truth: "Calorie deficit matters, not eliminating food groups",
    explanation: "Low-carb can work, but it's the calorie reduction that causes weight loss, not carb elimination. Many successful athletes eat 300+ grams of carbs daily while staying lean.",
    impact: "medium"
  }
];

export default function MythBusters() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const mythsPerPage = 3;
  
  const paginatedMyths = myths.slice(
    currentPage * mythsPerPage,
    (currentPage + 1) * mythsPerPage
  );

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl p-3 sm:p-6 shadow-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
        <h3 className="text-base sm:text-xl font-bold text-gray-900">Common Fitness Myths Debunked</h3>
      </div>

      <div className="space-y-4">
        {paginatedMyths.map((myth, index) => {
          const actualIndex = currentPage * mythsPerPage + index;
          const isExpanded = expandedIndex === actualIndex;
          
          return (
            <motion.div
              key={actualIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : actualIndex)}
                className="w-full p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <div className="space-y-3">
                      {/* Myth */}
                      <div className="flex items-start gap-2">
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">Myth</p>
                          <p className="text-sm sm:text-base text-gray-900 leading-relaxed">
                            {myth.myth}
                          </p>
                        </div>
                      </div>
                      
                      {/* Truth */}
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Truth</p>
                          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                            {myth.truth}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 mt-2 sm:mt-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(myth.impact)}`}>
                      {myth.impact} impact
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Info className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    </motion.div>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200"
                  >
                    <div className="p-3 sm:p-4 bg-gray-50">
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                        {myth.explanation}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      {myths.length > mythsPerPage && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage + 1} of {Math.ceil(myths.length / mythsPerPage)}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(Math.ceil(myths.length / mythsPerPage) - 1, currentPage + 1))}
            disabled={currentPage >= Math.ceil(myths.length / mythsPerPage) - 1}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              currentPage >= Math.ceil(myths.length / mythsPerPage) - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            Next
          </button>
        </div>
      )}

      <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Remember:</span> Sustainable fitness is about science, not trends. 
          Focus on consistent calorie balance, adequate protein, and regular activity for lasting results.
        </p>
      </div>
    </div>
  );
}