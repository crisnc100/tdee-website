'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Calculator, RefreshCw, ChevronRight, Clock, Target } from 'lucide-react';
import { TDEEResult } from '@/types/calculator';

interface StoredResult {
  bmr: number;
  tdee: number;
  errorMargin: {
    lower: number;
    upper: number;
  };
  components: {
    bmr: number;
    muscleFactor: number;
    jobActivity: number;
    neat: number;
    exercise: number;
    muscleRecovery: number;
  };
  recommendation: {
    maintain: number;
    mildWeightLoss: number;
    weightLoss: number;
    extremeWeightLoss: number;
    mildWeightGain: number;
    weightGain: number;
  };
}

interface QuickAccessProps {
  onViewResults: (result: TDEEResult) => void;
  onRecalculate: () => void;
}

export default function QuickAccess({ onViewResults, onRecalculate }: QuickAccessProps) {
  const [hasStoredResults, setHasStoredResults] = useState(false);
  const [storedResult, setStoredResult] = useState<StoredResult | null>(null);
  const [lastCalculatedDate, setLastCalculatedDate] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for stored results in localStorage
    const checkStoredResults = () => {
      try {
        const lastResult = localStorage.getItem('tdee-last-result');
        const lastCalculationDate = localStorage.getItem('tdee-last-calculation-date');
        const firstCalculationDate = localStorage.getItem('tdee-first-calculation-date');
        
        if (lastResult) {
          const parsedResult = JSON.parse(lastResult);
          setStoredResult(parsedResult);
          setHasStoredResults(true);
          
          // Calculate days since last calculation (use last calculation date if available, otherwise first)
          const dateToUse = lastCalculationDate || firstCalculationDate;
          if (dateToUse) {
            const date = new Date(dateToUse);
            const now = new Date();
            
            // Reset time parts to compare just the dates
            date.setHours(0, 0, 0, 0);
            now.setHours(0, 0, 0, 0);
            
            const diffTime = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
              // Check if it was actually calculated today or just within 24 hours
              const actualDate = new Date(dateToUse);
              const actualNow = new Date();
              const hoursDiff = Math.floor((actualNow.getTime() - actualDate.getTime()) / (1000 * 60 * 60));
              
              if (hoursDiff < 1) {
                const minutesDiff = Math.floor((actualNow.getTime() - actualDate.getTime()) / (1000 * 60));
                if (minutesDiff < 1) {
                  setLastCalculatedDate('Just now');
                } else if (minutesDiff === 1) {
                  setLastCalculatedDate('1 minute ago');
                } else if (minutesDiff < 60) {
                  setLastCalculatedDate(`${minutesDiff} minutes ago`);
                }
              } else if (hoursDiff === 1) {
                setLastCalculatedDate('1 hour ago');
              } else if (hoursDiff < 24) {
                setLastCalculatedDate(`${hoursDiff} hours ago`);
              } else {
                setLastCalculatedDate('Today');
              }
            } else if (diffDays === 1) {
              setLastCalculatedDate('Yesterday');
            } else if (diffDays < 7) {
              setLastCalculatedDate(`${diffDays} days ago`);
            } else if (diffDays < 30) {
              const weeks = Math.floor(diffDays / 7);
              setLastCalculatedDate(`${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`);
            } else {
              const months = Math.floor(diffDays / 30);
              setLastCalculatedDate(`${months} ${months === 1 ? 'month' : 'months'} ago`);
            }
          }
          
          setIsVisible(true);
        }
      } catch (error) {
        // console.error('Error reading stored results:', error);
      }
    };

    checkStoredResults();
  }, []);

  const handleViewResults = () => {
    if (storedResult) {
      onViewResults(storedResult as TDEEResult);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!hasStoredResults || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-1">
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Welcome Back!</h2>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last calculated {lastCalculatedDate}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Dismiss quick access"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {storedResult && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Your TDEE</span>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-500" />
                      <span className="text-2xl font-bold text-gray-900">
                        {storedResult.tdee.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-600">cal/day</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Range: {storedResult.errorMargin.lower.toLocaleString()} - {storedResult.errorMargin.upper.toLocaleString()} calories
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleViewResults}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 rounded-lg font-medium hover:shadow-lg transition-all cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  View Full Results
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onRecalculate}
                  className="flex items-center justify-center gap-2 bg-white border-2 border-orange-500 text-orange-600 px-4 py-3 rounded-lg font-medium hover:bg-orange-50 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recalculate
                </motion.button>
              </div>

              <div className="mt-4 flex items-center justify-center">
                <p className="text-xs text-gray-500">
                  Want to track your progress? Check your results and use our weekly check-in system!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
