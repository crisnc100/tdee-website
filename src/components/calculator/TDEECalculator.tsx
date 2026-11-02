'use client';

import { useState, useRef, useEffect } from 'react';
import { Calculator, BookOpen, RotateCcw } from 'lucide-react';
import { UserData, TDEEResult } from '@/types/calculator';
import { calculateTDEE } from '@/lib/calculator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import TDEEForm from './TDEEForm';
import TDEEResults from './TDEEResults';
import ResultHero from './ResultHero';
import MythBusters from '../education/MythBusters';
import QuickTips from '../education/QuickTips';
import QuickAccess from './QuickAccess';
import { StatusLamp } from '@/components/ui/lab';

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
      <div className="p-4 sm:p-6 lg:p-8 scroll-mt-20" ref={resultsRef}>
        {isCalculating ? (
          /* Skeleton Loader */
          <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 lab-enter">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <StatusLamp label="Running" live />
              <p role="status" className="label-caps text-muted-foreground">
                Calculating… {calculationSteps[calcStepIndex]}
              </p>
            </div>
            <div aria-hidden="true" className="relative h-0.5 bg-muted overflow-hidden mb-8">
              <div className="absolute inset-y-0 left-0 w-1/4 bg-accent-ink lab-scan" />
            </div>
            <div aria-hidden="true" className="animate-pulse space-y-6">
              <div className="grid gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-center">
                <div className="mx-auto w-56 h-40 rounded-t-full border-[12px] border-b-0 border-muted" />
                <div className="space-y-3">
                  <div className="h-16 bg-muted" />
                  <div className="h-16 bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="h-9 bg-muted" />
                ))}
              </div>
            </div>
          </div>
        ) : !showResults ? (
          /* Input Form - Full Width */
          <div className="max-w-4xl mx-auto">
            {/* Quick Access for Returning Users */}
            <QuickAccess
              onViewResults={handleQuickAccessViewResults}
              onRecalculate={handleQuickAccessRecalculate}
            />

            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p aria-hidden="true" className="label-caps text-muted-foreground mb-1">
                  Input {'//'} 4 phases
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Your Information</h2>
              </div>
              <StatusLamp label="Ready" />
            </div>

            <TDEEForm
              userData={userData}
              onChange={setUserData}
              onCalculate={handleCalculate}
            />
          </div>
        ) : (
          /* Results - Full Width Clean Layout */
          <div className="max-w-6xl mx-auto lab-enter">
            {/* Header with Recalculate Button */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <p aria-hidden="true" className="label-caps text-muted-foreground mb-1">
                  Result {'//'} estimate
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Your TDEE Results</h2>
                <p className="text-sm text-muted-foreground mt-1">Personalized for your body and lifestyle</p>
              </div>
              <button
                type="button"
                onClick={handleRecalculate}
                className="min-h-11 px-4 border border-input rounded-[3px] text-foreground hover:bg-muted hover:border-foreground transition-colors flex items-center gap-2 label-caps cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Recalculate
              </button>
            </div>

            {result && (
              <div className="space-y-8">
                {/* Main TDEE Display: gauge, error margin and goal targets */}
                <ResultHero result={result} displayTdee={displayTdee} />

                {/* Quick Tips */}
                <QuickTips userData={userData} />

                <div>
                  {/* Tab Navigation */}
                  <div role="group" aria-label="Result details" className="flex border-b border-border mb-6">
                    {tabs.map(({ id, label, icon: Icon }) => {
                      const active = activeTab === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setActiveTab(id)}
                          aria-pressed={active}
                          className={`relative -mb-px min-h-11 px-4 sm:px-5 flex items-center gap-2 label-caps border-b-2 transition-colors cursor-pointer ${
                            active
                              ? 'border-accent-ink text-foreground'
                              : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'calculator' && (
                    <div key="results-tab" className="lab-enter">
                      <TDEEResults result={result} />
                    </div>
                  )}

                  {activeTab === 'education' && (
                    <div key="education-tab" className="space-y-8 lab-enter">
                      <MythBusters />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
