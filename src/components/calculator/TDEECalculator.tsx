'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, BarChart3, Share2, Users, Target, TrendingUp, ChefHat, Brain, BookOpen } from 'lucide-react';
import { UserData, TDEEResult } from '@/types/calculator';
import { calculateTDEE, generateShareableId } from '@/lib/calculator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { generateDemoCount } from '@/utils/counter';
import TDEEForm from './TDEEForm';
import TDEEResults from './TDEEResults';
import ComparisonTool from './ComparisonTool';
import SocialShare from './SocialShare';
import MacroCalculator from '../ai/MacroCalculator';
import MealSuggestions from '../ai/MealSuggestions';
import AICoachComingSoon from '../ai/AICoachComingSoon';
import ProgressTracker from '../tracking/ProgressTracker';
import WeeklyCheckIn from '../progress/WeeklyCheckIn';
import SuccessStories from '../education/SuccessStories';
import MythBusters from '../education/MythBusters';
import QuickTips from '../education/QuickTips';
import QuickAccess from './QuickAccess';

const initialUserData: UserData = {
  age: 0,
  gender: 'male',
  units: 'metric',
  weight: 0,
  height: 0,
  heightFeet: 0,
  heightInches: 0,
  jobActivity: 'desk',
  steps: 5000,
  calculatorMode: 'simple',
  simpleExerciseLevel: 'none',
  // Advanced mode defaults
  bodyFat: undefined,
  activityLevel: undefined,
  exercises: [],
  muscleMass: undefined,
  trainingFrequency: undefined,
  // Legacy fields for backward compatibility
  exerciseMinutes: undefined,
  exerciseIntensity: undefined,
  exerciseType: undefined,
};

export default function TDEECalculator() {
  const [userData, setUserData] = useLocalStorage<UserData>('tdee-user-data', initialUserData);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check URL parameters for specific tabs
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'tracking') {
      // Only auto-load results if explicitly navigating to tracking tab
      const storedResult = localStorage.getItem('tdee-last-result');
      if (storedResult) {
        const parsed = JSON.parse(storedResult);
        setResult(parsed);
        setShowResults(true);
        setActiveTab('tracking');
      }
    }
  }, []);
  const [result, setResult] = useState<TDEEResult | null>(null);
  const [shareId, setShareId] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'comparison' | 'macros' | 'meals' | 'coaching' | 'tracking' | 'education' | 'share'>('calculator');
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    // Scroll to top of results area immediately when loading starts
    resultsRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
    
    // Increment the calculation count
    try {
      await fetch('/api/count', { method: 'POST' });
    } catch (error) {
      console.error('Failed to increment count:', error);
    }
    
    // Add a realistic delay for loading animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const calculatedResult = calculateTDEE(userData);
    setResult(calculatedResult);
    
    // Store last result and user data for quick access
    localStorage.setItem('tdee-last-result', JSON.stringify(calculatedResult));
    localStorage.setItem('tdee-last-user-data', JSON.stringify(userData));
    
    // Track TDEE calculation for coaching prompt
    localStorage.setItem('lastTDEECalculation', new Date().toISOString());
    
    // Track first calculation date for check-ins
    if (!localStorage.getItem('tdee-first-calculation-date')) {
      localStorage.setItem('tdee-first-calculation-date', new Date().toISOString());
    } else {
      // Update the last calculation date for returning users
      localStorage.setItem('tdee-last-calculation-date', new Date().toISOString());
    }
    
    // Generate shareable ID and store result
    const id = generateShareableId();
    setShareId(id);
    localStorage.setItem(`tdee-result-${id}`, JSON.stringify({
      userData,
      result: calculatedResult,
      timestamp: new Date().toISOString()
    }));
    
    setIsCalculating(false);
    setShowResults(true);
  };

  const handleRecalculate = () => {
    setShowResults(false);
    setResult(null);
    setActiveTab('calculator');
  };

  const handleQuickAccessViewResults = (storedResult: TDEEResult) => {
    setResult(storedResult);
    setShowResults(true);
    setActiveTab('calculator');
  };

  const handleQuickAccessRecalculate = () => {
    // Keep the form populated with previous data but don't show results
    setShowResults(false);
    setResult(null);
    setActiveTab('calculator');
  };

  const todaysCount = generateDemoCount();

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/30">
   

      {/* Calculator */}
      <div className="p-6" ref={resultsRef}>
        {isCalculating ? (
          /* Loading Animation */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative mb-8">
              <div className="w-20 h-20 border-4 border-orange-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <motion.h3 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-gray-900 mb-2"
            >
              Calculating Your TDEE...
            </motion.h3>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-gray-600 text-center max-w-md"
            >
              Analyzing your muscle mass, activity levels, and metabolic factors for the most accurate results
            </motion.p>
          </motion.div>
        ) : !showResults ? (
          /* Input Form - Full Width */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            {/* Quick Access for Returning Users */}
            {isClient && (
              <QuickAccess 
                onViewResults={handleQuickAccessViewResults}
                onRecalculate={handleQuickAccessRecalculate}
              />
            )}
            
            <div className="flex items-center justify-center mb-8">
              <Calculator className="w-6 h-6 text-primary-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Your Information</h2>
            </div>
            
            {isClient && (
              <TDEEForm 
                userData={userData} 
                onChange={setUserData}
                onCalculate={handleCalculate}
              />
            )}
          </motion.div>
        ) : (
          /* Results - Full Width Clean Layout */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            {/* Header with Recalculate Button */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Your TDEE Results</h2>
                  <p className="text-gray-600">Personalized for your body and lifestyle</p>
                </div>
              </div>
              <button
                onClick={handleRecalculate}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Recalculate
              </button>
            </div>

            {result && (
              <>
                {/* Weekly Check-in (shows when applicable) */}
                <WeeklyCheckIn userData={userData} tdeeResult={result} />
                
                {/* Quick Tips */}
                <QuickTips userData={userData} />
                
                {/* Main TDEE Display */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-8 mb-8 border border-orange-200"
                >
                  <div className="text-center">
                    <div className="text-6xl font-bold text-orange-600 mb-2">
                      {result.tdee.toLocaleString()}
                    </div>
                    <div className="text-2xl text-gray-700 mb-4">calories per day</div>
                    <div className="text-lg text-gray-600 mb-6">
                      Range: {result.errorMargin.lower.toLocaleString()} - {result.errorMargin.upper.toLocaleString()} calories
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      <div className="bg-white/60 rounded-lg p-4">
                        <div className="text-2xl font-bold text-red-600">{result.recommendation.weightLoss}</div>
                        <div className="text-sm text-gray-600">Weight Loss</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-700">{result.recommendation.maintain}</div>
                        <div className="text-sm text-gray-600">Maintenance</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">{result.recommendation.weightGain}</div>
                        <div className="text-sm text-gray-600">Weight Gain</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex flex-wrap justify-center gap-2 mb-8 bg-gray-100 rounded-lg p-2"
                >
                  {[
                    { id: 'calculator', label: 'Breakdown', icon: Calculator },
                    { id: 'comparison', label: 'Compare', icon: BarChart3 },
                    { id: 'macros', label: 'Macros', icon: Target },
                    { id: 'meals', label: 'Meals', icon: ChefHat },
                    { id: 'coaching', label: 'AI Coach', icon: Brain },
                    { id: 'tracking', label: 'Track', icon: TrendingUp },
                    { id: 'education', label: 'Learn', icon: BookOpen },
                    { id: 'share', label: 'Share', icon: Share2 }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`flex items-center gap-2 py-3 px-6 rounded-md font-medium transition-all duration-200 ${
                        activeTab === id
                          ? 'bg-white text-orange-600 shadow-md'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </motion.div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {activeTab === 'calculator' && (
                    <motion.div
                      key="results-tab"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <TDEEResults result={result} />
                    </motion.div>
                  )}
                  
                  {activeTab === 'comparison' && (
                    <motion.div
                      key="comparison-tab"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <ComparisonTool userData={userData} ourResult={result.tdee} />
                    </motion.div>
                  )}
                  
                  {activeTab === 'macros' && (
                    <motion.div
                      key="macros-tab"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <MacroCalculator defaultCalories={result.recommendation.maintain} userData={userData} />
                    </motion.div>
                  )}
                  
                  {activeTab === 'meals' && (
                    <motion.div
                      key="meals-tab"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <MealSuggestions defaultCalories={result.recommendation.maintain} />
                    </motion.div>
                  )}
                  
                  {activeTab === 'coaching' && (
                    <motion.div
                      key="coaching-tab"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <AICoachComingSoon />
                    </motion.div>
                  )}
                  
                  {activeTab === 'tracking' && (
                    <motion.div
                      key="tracking-tab"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <ProgressTracker userData={userData} currentTDEE={result.tdee} />
                    </motion.div>
                  )}
                  
                  {activeTab === 'education' && (
                    <motion.div
                      key="education-tab"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-8"
                    >
                      <SuccessStories userData={userData} />
                      <MythBusters />
                    </motion.div>
                  )}
                  
                  {activeTab === 'share' && (
                    <motion.div
                      key="share-tab"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <SocialShare result={result} shareId={shareId} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}