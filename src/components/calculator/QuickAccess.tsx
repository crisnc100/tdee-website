'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, ChevronRight, Clock, X } from 'lucide-react';
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
      } catch {
        // Ignore unreadable stored results
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
    <section aria-labelledby="quick-access-heading" className="mb-8 border border-border rounded-[3px] bg-background/60 lab-enter">
      <div className="flex items-start justify-between gap-3 border-b border-border pl-3 sm:pl-4">
        <div className="py-2.5 min-w-0">
          <h2 id="quick-access-heading" className="label-caps text-foreground">Welcome Back!</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Clock aria-hidden="true" className="w-3 h-3" />
            Last calculated {lastCalculatedDate}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex items-center justify-center w-11 h-11 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Dismiss quick access"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 sm:p-4">
        {storedResult && (
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 mb-4">
            <div>
              <p className="label-caps text-muted-foreground">Your TDEE</p>
              <p className="readout mt-1">
                <span className="text-3xl font-semibold text-accent-ink">{storedResult.tdee.toLocaleString()}</span>{' '}
                <span className="text-xs text-muted-foreground">cal/day</span>
              </p>
            </div>
            <p className="readout text-xs text-muted-foreground">
              Range: {storedResult.errorMargin.lower.toLocaleString()} - {storedResult.errorMargin.upper.toLocaleString()} calories
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleViewResults}
            className="group min-h-11 px-4 flex items-center justify-center gap-2 bg-accent text-accent-foreground border border-accent-ink rounded-[3px] label-caps hover:brightness-105 active:translate-y-px transition cursor-pointer"
          >
            View Full Results
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={onRecalculate}
            className="min-h-11 px-4 flex items-center justify-center gap-2 border border-input rounded-[3px] text-foreground label-caps hover:bg-muted hover:border-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Recalculate
          </button>
        </div>
      </div>
    </section>
  );
}
