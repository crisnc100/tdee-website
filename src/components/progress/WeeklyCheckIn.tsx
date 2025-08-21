'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, TrendingDown, TrendingUp, Minus, Trophy, Target, CheckCircle } from 'lucide-react';
import { UserData, TDEEResult } from '@/types/calculator';

interface CheckInData {
  date: string;
  weight?: number;
  progress: 'lost' | 'maintained' | 'gained';
  adherence?: number; // 1-5 scale
  notes?: string;
}

interface WeeklyCheckInProps {
  userData: UserData;
  tdeeResult: TDEEResult;
  onClose?: () => void;
}

export default function WeeklyCheckIn({ userData, tdeeResult, onClose }: WeeklyCheckInProps) {
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<'lost' | 'maintained' | 'gained' | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number | undefined>();
  const [lastCheckInDate, setLastCheckInDate] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Load check-in history from localStorage
    const stored = localStorage.getItem('tdee-checkins');
    if (stored) {
      const data = JSON.parse(stored);
      setCheckIns(data);
      
      // Calculate streak
      const sortedCheckIns = [...data].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      let currentStreak = 0;
      const today = new Date();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      
      for (let i = 0; i < sortedCheckIns.length; i++) {
        const checkInDate = new Date(sortedCheckIns[i].date);
        const expectedDate = new Date(today.getTime() - (i * oneWeek));
        const diff = Math.abs(checkInDate.getTime() - expectedDate.getTime());
        
        if (diff < oneWeek * 1.5) { // Allow some flexibility
          currentStreak++;
        } else {
          break;
        }
      }
      
      setStreak(currentStreak);
      
      // Check if it's been 7+ days since last check-in
      if (sortedCheckIns.length > 0) {
        const lastDate = new Date(sortedCheckIns[0].date);
        setLastCheckInDate(sortedCheckIns[0].date);
        const daysSinceLastCheckIn = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastCheckIn >= 7) {
          setShowCheckIn(true);
        }
      } else {
        // First time user, show after 7 days from calculation
        const calculationDate = localStorage.getItem('tdee-first-calculation-date');
        if (calculationDate) {
          const daysSinceCalculation = Math.floor((today.getTime() - new Date(calculationDate).getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceCalculation >= 7) {
            setShowCheckIn(true);
          }
        }
      }
    }
  }, []);

  const handleCheckIn = () => {
    if (!currentProgress) return;

    const newCheckIn: CheckInData = {
      date: new Date().toISOString(),
      weight: currentWeight,
      progress: currentProgress,
    };

    const updatedCheckIns = [...checkIns, newCheckIn];
    setCheckIns(updatedCheckIns);
    localStorage.setItem('tdee-checkins', JSON.stringify(updatedCheckIns));
    
    setShowCheckIn(false);
    setCurrentProgress(null);
    setCurrentWeight(undefined);
    
    // Update streak
    setStreak(streak + 1);
  };

  const getAdaptiveRecommendation = () => {
    if (!currentProgress || checkIns.length === 0) return null;

    const recentCheckIns = checkIns.slice(-3); // Last 3 check-ins
    const notLosingCount = recentCheckIns.filter(c => c.progress !== 'lost').length;
    
    if (userData.goal === 'lose' && notLosingCount >= 2) {
      return {
        type: 'adjustment',
        message: 'Based on your recent check-ins, you might need to reduce your daily calories by 100-150 to see more progress.',
        newTarget: tdeeResult.recommendation.weightLoss - 100
      };
    }
    
    if (userData.goal === 'gain' && recentCheckIns.filter(c => c.progress !== 'gained').length >= 2) {
      return {
        type: 'adjustment',
        message: 'To support your muscle-building goals, try increasing your daily calories by 100-150.',
        newTarget: tdeeResult.recommendation.weightGain + 100
      };
    }
    
    if (currentProgress === 'lost' && userData.goal === 'lose') {
      return {
        type: 'success',
        message: 'Great progress! Keep following your current plan - it\'s working well for you.',
        newTarget: tdeeResult.recommendation.weightLoss
      };
    }
    
    return null;
  };

  const getMilestoneMessage = () => {
    if (streak === 2) return "🎯 2 Week Streak! You're building consistency!";
    if (streak === 4) return "🔥 1 Month of tracking! Amazing dedication!";
    if (streak === 8) return "⭐ 2 Months strong! You're unstoppable!";
    if (streak === 12) return "🏆 3 Month Champion! Incredible commitment!";
    if (streak >= 24) return "💎 6+ Months! You're a tracking legend!";
    return null;
  };

  const recommendation = getAdaptiveRecommendation();
  const milestone = getMilestoneMessage();

  if (!showCheckIn && !milestone) return null;

  return (
    <AnimatePresence>
      {(showCheckIn || milestone) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200"
        >
          {milestone && (
            <div className="mb-4 text-center">
              <p className="text-lg font-bold text-amber-900">{milestone}</p>
            </div>
          )}

          {showCheckIn && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-bold text-gray-900">Weekly Check-In</h3>
                </div>
                {streak > 0 && (
                  <div className="flex items-center gap-1 bg-amber-100 px-3 py-1 rounded-full">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-700">{streak} week streak</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4">
                How has your progress been this week?
              </p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => setCurrentProgress('lost')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    currentProgress === 'lost'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <TrendingDown className="w-5 h-5 mx-auto mb-1 text-green-600" />
                  <p className="text-sm font-medium">Lost Weight</p>
                </button>

                <button
                  onClick={() => setCurrentProgress('maintained')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    currentProgress === 'maintained'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <Minus className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <p className="text-sm font-medium">Maintained</p>
                </button>

                <button
                  onClick={() => setCurrentProgress('gained')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    currentProgress === 'gained'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                  <p className="text-sm font-medium">Gained Weight</p>
                </button>
              </div>

              {currentProgress && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Weight (optional)
                  </label>
                  <input
                    type="number"
                    value={currentWeight || ''}
                    onChange={(e) => setCurrentWeight(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder={`${userData.weight} ${userData.units === 'imperial' ? 'lbs' : 'kg'}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </motion.div>
              )}

              {recommendation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mb-4 p-3 rounded-lg ${
                    recommendation.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Target className={`w-5 h-5 mt-0.5 ${
                      recommendation.type === 'success' ? 'text-green-600' : 'text-blue-600'
                    }`} />
                    <div>
                      <p className={`text-sm ${
                        recommendation.type === 'success' ? 'text-green-900' : 'text-blue-900'
                      }`}>
                        {recommendation.message}
                      </p>
                      {recommendation.newTarget && (
                        <p className={`text-xs mt-1 ${
                          recommendation.type === 'success' ? 'text-green-700' : 'text-blue-700'
                        }`}>
                          Suggested daily target: {recommendation.newTarget} calories
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCheckIn}
                  disabled={!currentProgress}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    currentProgress
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Complete Check-In
                </button>
                
                {onClose && (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Later
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}