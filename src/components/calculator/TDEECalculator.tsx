'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Calculator, BookOpen, RotateCcw, UtensilsCrossed, Activity, FlaskConical, X } from 'lucide-react';
import { UserData, TDEEResult } from '@/types/calculator';
import { calculateTDEE } from '@/lib/calculator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDailyLog } from '@/hooks/useDailyLog';
import { addDays, kgFromDisplay, localToday, type WeightUnit } from '@/lib/log/entries';
import { runLogEngine } from '@/lib/log/engine';
import { buildSample, SAMPLE_DAYS, type SampleLog } from '@/lib/log/sample';
import TrackPanel, { type TrackStatus } from '@/components/track/TrackPanel';
import { primaryButton } from '@/components/track/shared';
import TDEEForm from './TDEEForm';
import TDEEResults from './TDEEResults';
import ResultHero from './ResultHero';
import MealSuggestions from './MealSuggestions';
import MythBusters from '../education/MythBusters';
import QuickTips from '../education/QuickTips';
import QuickAccess from './QuickAccess';
import { StatusLamp } from '@/components/ui/lab';
import { resolveTab, settleTab, type Tab } from './tabs';

const tabs: { id: Tab; label: string; icon: typeof Calculator }[] = [
  { id: 'calculator', label: 'Breakdown', icon: Calculator },
  { id: 'meals', label: 'Meals', icon: UtensilsCrossed },
  { id: 'education', label: 'Learn', icon: BookOpen },
  { id: 'track', label: 'Track', icon: Activity },
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
  // null: the default tab, which is Track once the log has entries. Fixed as the choice once results show (tabs.ts).
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  // The Track tab's status line lives here so a Delete's Undo survives the panel unmounting.
  const [trackStatus, setTrackStatus] = useState<TrackStatus | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const sampleToggle = useRef<HTMLButtonElement>(null);
  const [displayTdee, setDisplayTdee] = useState<number>(0);
  const log = useDailyLog();
  // Sample mode: a synthetic log held in memory only. The saved log is never read or written while it is on.
  const [sample, setSample] = useState<SampleLog | null>(null);

  const weightUnit: WeightUnit = userData.units === 'imperial' ? 'lbs' : 'kg';
  // An unmatched sample is someone else, so the hero shows that person's formula result.
  const sampleResult = useMemo(() => (sample && !sample.matched ? calculateTDEE(sample.userData) : null), [sample]);
  const heroResult = sampleResult ?? result;
  const viewEntries = sample ? sample.entries : log.entries;
  const engineUser = sample ? sample.userData : userData;
  const engineWeightKg = kgFromDisplay(engineUser.weight, engineUser.units === 'imperial' ? 'lbs' : 'kg');
  const formulaTdee = heroResult?.tdee ?? 0;
  // Pure and deterministic; a year of daily entries takes about 2 ms.
  const engine = useMemo(
    () => (formulaTdee > 0 ? runLogEngine(viewEntries, { formulaTdeeKcal: formulaTdee, weightKg: engineWeightKg }) : null),
    [viewEntries, formulaTdee, engineWeightKg],
  );
  // The sample's true value for each engine day, for the chart; undefined unless every day has one.
  const truthKcal = useMemo(() => {
    if (!sample || !engine) return undefined;
    const byDate = new Map(sample.truth.map((t) => [t.date, t.kcal]));
    const values = engine.run.days.map((d) => byDate.get(addDays(engine.startDate, d.day)));
    return values.every((v): v is number => v !== undefined) ? values : undefined;
  }, [sample, engine]);
  const hasEntries = viewEntries.length > 0;
  const settledTab = settleTab(activeTab, hasEntries, showResults && log.loaded);
  // Set during render: React's documented way to adjust state when other values change.
  if (settledTab !== activeTab) setActiveTab(settledTab);
  const currentTab = resolveTab(settledTab, hasEntries);

  const loadSample = () => {
    if (!result) return;
    setSample(buildSample({ userData, formulaTdeeKcal: result.tdee, today: localToday() }));
    setActiveTab('track');
  };

  // Exit can come from the Track tab, whose button then disappears; the header toggle is where focus goes.
  const exitSample = () => {
    setSample(null);
    setActiveTab(null);
    sampleToggle.current?.focus();
  };

  const handleCalculate = () => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    resultsRef.current?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });

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

    setActiveTab(null);
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
    setActiveTab(null);
    setSample(null);
  };

  const handleQuickAccessViewResults = (storedResult: TDEEResult) => {
    setResult(storedResult);
    setShowResults(true);
    setActiveTab(null);
    setSample(null);
  };

  const handleQuickAccessRecalculate = () => {
    // Keep the form populated with previous data but don't show results
    setShowResults(false);
    setResult(null);
    setActiveTab(null);
    setSample(null);
  };

  return (
    <div className="panel brackets text-foreground">
      {/* Calculator */}
      <div className="p-4 sm:p-6 lg:p-8 scroll-mt-20" ref={resultsRef}>
        {!showResults ? (
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
              <div className="flex flex-wrap gap-2">
                {/* One button that toggles, so focus stays put when the mode changes */}
                <button ref={sampleToggle} type="button" onClick={sample ? exitSample : loadSample} className={primaryButton}>
                  {sample ? (
                    <X aria-hidden="true" className="w-4 h-4" />
                  ) : (
                    <FlaskConical aria-hidden="true" className="w-4 h-4" />
                  )}
                  {sample ? 'Exit sample' : 'Load sample weeks'}
                </button>
                <button
                  type="button"
                  onClick={handleRecalculate}
                  className="min-h-11 px-4 border border-input rounded-[3px] text-foreground hover:bg-muted hover:border-foreground transition-colors flex items-center gap-2 label-caps cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Recalculate
                </button>
              </div>
            </div>

            <div role="status">
              {sample && (
                <div className="mb-6 bg-accent text-accent-foreground rounded-[3px] px-4 py-3 lab-enter">
                  <p className="text-sm leading-relaxed">
                    <span className="label-caps mr-2">Sample mode</span>
                    {SAMPLE_DAYS / 7} weeks of a synthetic person{sample.matched ? ' with your inputs' : ''}, made on this
                    device by the engine&apos;s own simulator. Nothing is saved, and your own log
                    {log.entries.length > 0 ? ` (${log.entries.length.toLocaleString()} entries)` : ''} is untouched.
                  </p>
                </div>
              )}
            </div>

            {result && heroResult && (
              <div className="space-y-8">
                {/* Main TDEE Display: gauge, error margin and goal targets */}
                <ResultHero
                  result={heroResult}
                  displayTdee={sampleResult ? sampleResult.tdee : displayTdee}
                  measured={engine ? { engine, truthKcal, sample: sample !== null } : undefined}
                />

                {/* Quick Tips */}
                <QuickTips userData={userData} />

                <div>
                  {/* Tab Navigation */}
                  <div role="group" aria-label="Result details" className="flex border-b border-border mb-6">
                    {tabs.map(({ id, label, icon: Icon }) => {
                      const active = currentTab === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setActiveTab(id)}
                          aria-pressed={active}
                          className={`relative -mb-px min-h-11 px-2.5 sm:px-5 shrink-0 flex items-center gap-2 label-caps tracking-[0.08em] sm:tracking-[0.14em] border-b-2 transition-colors cursor-pointer ${
                            active
                              ? 'border-accent-ink text-foreground'
                              : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon aria-hidden="true" className="hidden sm:block w-4 h-4" />
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Content */}
                  {currentTab === 'calculator' && (
                    <div key="results-tab" className="lab-enter">
                      <TDEEResults result={result} />
                    </div>
                  )}

                  {currentTab === 'meals' && (
                    <div key="meals-tab" className="lab-enter">
                      <MealSuggestions defaultCalories={result.recommendation.maintain} />
                    </div>
                  )}

                  {currentTab === 'education' && (
                    <div key="education-tab" className="space-y-8 lab-enter">
                      <MythBusters />
                    </div>
                  )}

                  {currentTab === 'track' && (
                    <div key="track-tab" className="lab-enter">
                      <TrackPanel
                        entries={viewEntries}
                        engine={engine}
                        unit={weightUnit}
                        today={localToday()}
                        log={log}
                        status={trackStatus}
                        onStatus={setTrackStatus}
                        sample={
                          sample
                            ? {
                                matched: sample.matched,
                                meanLoggingGapKcal: sample.meanLoggingGapKcal,
                                truthTodayKcal: sample.truth[sample.truth.length - 1].kcal,
                                savedEntries: log.entries.length,
                                onExit: exitSample,
                              }
                            : null
                        }
                        onLoadSample={loadSample}
                      />
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
