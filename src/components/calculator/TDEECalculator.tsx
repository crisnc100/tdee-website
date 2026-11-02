'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, BookOpen } from 'lucide-react';
import { UserData, TDEEResult } from '@/types/calculator';
import { calculateTDEE } from '@/lib/calculator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import TDEEForm from './TDEEForm';
import TDEEResults from './TDEEResults';
import MythBusters from '../education/MythBusters';
import QuickTips from '../education/QuickTips';
import QuickAccess from './QuickAccess';

type Tab = 'calculator' | 'education';

// Subtle rotating microcopy for calculation steps
const calculationSteps = [
  'Estimating BMR…',
  'Factoring NEAT (steps)…',
  'Adjusting for muscle & recovery…'
];

const tabs: { id: Tab; label: string; icon: typeof Calculator }[] = [
  { id: 'calculator', label: 'Breakdown', icon: Calculator },
  { id: 'education', label: 'Learn', icon: BookOpen },
];

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
  const [result, setResult] = useState<TDEEResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const resultsRef = useRef<HTMLDivElement>(null);
  const [displayTdee, setDisplayTdee] = useState<number>(0);

  const [calcStepIndex, setCalcStepIndex] = useState(0);

  useEffect(() => {
    if (!isCalculating) return;
    setCalcStepIndex(0);
    const interval = setInterval(() => {
      setCalcStepIndex((i) => (i + 1) % calculationSteps.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isCalculating]);

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    // Scroll to top of results area immediately when loading starts
    resultsRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
    
    // Add a realistic delay for loading animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const calculatedResult = calculateTDEE(userData);
    setResult(calculatedResult);
    
    // Store last result and user data for quick access
    localStorage.setItem('tdee-last-result', JSON.stringify(calculatedResult));
    localStorage.setItem('tdee-last-result-meta', JSON.stringify({ timestamp: new Date().toISOString() }));
    localStorage.setItem('tdee-last-user-data', JSON.stringify(userData));
    localStorage.setItem('tdee-last-user-data-meta', JSON.stringify({ timestamp: new Date().toISOString() }));
    
    // First/last calculation dates feed the "Last calculated" line in QuickAccess
    if (!localStorage.getItem('tdee-first-calculation-date')) {
      localStorage.setItem('tdee-first-calculation-date', new Date().toISOString());
    } else {
      // Update the last calculation date for returning users
      localStorage.setItem('tdee-last-calculation-date', new Date().toISOString());
    }
    
    setIsCalculating(false);
    setShowResults(true);
  };

  // Count-up animation for TDEE reveal (respect reduced motion)
  useEffect(() => {
    if (!showResults || !result) return;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplayTdee(result.tdee);
      return;
    }
    const duration = 700;
    const start = performance.now();
    const from = 0;
    const to = result.tdee;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf = 0 as number | undefined as number;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      const val = Math.round(from + (to - from) * eased);
      setDisplayTdee(val);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [showResults, result]);

  // LocalStorage hygiene: purge expired/corrupt entries
  useEffect(() => {
    try {
      const now = Date.now();
      const days = (d: number) => d * 24 * 60 * 60 * 1000;
      // Remove old saved share results (> 30 days); the share feature is gone
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) keys.push(k);
      }
      keys.forEach((key) => {
        if (key.startsWith('tdee-result-')) {
          try {
            const obj = JSON.parse(localStorage.getItem(key) || 'null');
            const ts = obj?.timestamp ? Date.parse(obj.timestamp) : NaN;
            if (!obj || !isFinite(ts) || now - ts > days(30)) {
              localStorage.removeItem(key);
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      });
      // Expire last result/user data after 90 days if meta exists
      const tryExpire = (dataKey: string, metaKey: string) => {
        try {
          const meta = JSON.parse(localStorage.getItem(metaKey) || 'null');
          const ts = meta?.timestamp ? Date.parse(meta.timestamp) : NaN;
          if (isFinite(ts) && now - ts > days(90)) {
            localStorage.removeItem(dataKey);
            localStorage.removeItem(metaKey);
          }
        } catch {
          localStorage.removeItem(metaKey);
        }
      };
      tryExpire('tdee-last-result', 'tdee-last-result-meta');
      tryExpire('tdee-last-user-data', 'tdee-last-user-data-meta');
    } catch {
      // ignore
    }
  }, []);

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

  return (
    <div className="panel brackets text-foreground">
   

      {/* Calculator */}
      <div className="p-6" ref={resultsRef}>
        {isCalculating ? (
          /* Skeleton Loader */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-4xl mx-auto py-12"
          >
            <div className="text-center mb-6 text-sm text-muted-foreground">
              Calculating… {calculationSteps[calcStepIndex]}
            </div>
            <div className="animate-pulse space-y-6">
              <div className="h-6 bg-muted rounded w-48 mx-auto" />
              <div className="h-12 bg-muted rounded w-40 mx-auto" />
              <div className="h-4 bg-muted rounded w-56 mx-auto" />
              <div className="h-16 bg-muted rounded w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-20 bg-muted rounded" />
                <div className="h-20 bg-muted rounded" />
                <div className="h-20 bg-muted rounded" />
              </div>
            </div>
          </motion.div>
        ) : !showResults ? (
          /* Input Form - Full Width */
          <div className="max-w-4xl mx-auto">
            {/* Quick Access for Returning Users */}
            <QuickAccess
              onViewResults={handleQuickAccessViewResults}
              onRecalculate={handleQuickAccessRecalculate}
            />

            <div className="flex items-center justify-center mb-8">
              <Calculator className="w-6 h-6 text-accent mr-3" />
              <h2 className="text-2xl font-bold text-foreground">Your Information</h2>
            </div>

            <TDEEForm
              userData={userData}
              onChange={setUserData}
              onCalculate={handleCalculate}
            />
          </div>
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
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mr-4">
                  <Calculator className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-foreground">Your TDEE Results</h2>
                  <p className="text-foreground">Personalized for your body and lifestyle</p>
                </div>
              </div>
              <button
                onClick={handleRecalculate}
                className="px-6 py-3 bg-muted hover:bg-border text-foreground rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                Recalculate
              </button>
            </div>

            {result && (
              <>
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
                      {displayTdee.toLocaleString()}
                    </div>
                    <div className="text-2xl text-foreground mb-4">calories per day</div>
                    <div className="text-lg text-muted-foreground mb-6">
                      Range: {result.errorMargin.lower.toLocaleString()} - {result.errorMargin.upper.toLocaleString()} calories
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      <div className="bg-card/60 rounded-lg p-4">
                        <div className="text-2xl font-bold text-red-600">{result.recommendation.weightLoss}</div>
                        <div className="text-sm text-muted-foreground">Weight Loss</div>
                      </div>
                      <div className="bg-card/60 rounded-lg p-4">
                        <div className="text-2xl font-bold text-foreground">{result.recommendation.maintain}</div>
                        <div className="text-sm text-muted-foreground">Maintenance</div>
                      </div>
                      <div className="bg-card/60 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">{result.recommendation.weightGain}</div>
                        <div className="text-sm text-muted-foreground">Weight Gain</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex flex-wrap justify-center gap-2 mb-8 bg-muted rounded-lg p-2 "
                >
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-2 py-3 px-6 rounded-md font-medium transition-all duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 ${
                        activeTab === id
                          ? 'bg-card text-accent shadow-md'
                          : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
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

                  {activeTab === 'education' && (
                    <motion.div
                      key="education-tab"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-8"
                    >
                      <MythBusters />
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
