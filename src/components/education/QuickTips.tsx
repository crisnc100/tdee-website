'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, Clock, Sun, Moon } from 'lucide-react';
import { UserData } from '@/types/calculator';

interface Tip {
  text: string;
  category: 'morning' | 'evening' | 'exercise' | 'nutrition' | 'lifestyle' | 'goal-specific';
  relevantFor?: (userData: UserData) => boolean;
}

const tips: Tip[] = [
  // Morning Tips
  {
    text: "Start your day with 16-20oz of water to kickstart metabolism and hydration.",
    category: 'morning',
  },
  {
    text: "Morning protein (20-30g) helps control hunger throughout the day.",
    category: 'morning',
  },
  {
    text: "A 10-minute morning walk can boost your NEAT by 100+ calories.",
    category: 'morning',
  },
  
  // Evening Tips
  {
    text: "Prepare tomorrow's meals tonight - decision fatigue is real.",
    category: 'evening',
  },
  {
    text: "Wind down 1 hour before bed - better sleep means better recovery.",
    category: 'evening',
  },
  {
    text: "Evening casein protein (20g) supports overnight muscle recovery.",
    category: 'evening',
    relevantFor: (userData) => !!(userData.exercises && userData.exercises.length > 0)
  },
  
  // Exercise Tips
  {
    text: "Progressive overload: Add 5lbs or 1 rep each week for continuous gains.",
    category: 'exercise',
    relevantFor: (userData) => !!(userData.exercises?.some(e => e.type === 'weight_lifting'))
  },
  {
    text: "HIIT burns calories for 24-48 hours post-workout (EPOC effect).",
    category: 'exercise',
    relevantFor: (userData) => !!(userData.exercises?.some(e => e.type === 'hiit'))
  },
  {
    text: "Walk during phone calls - easy way to add 2000+ steps daily.",
    category: 'exercise',
    relevantFor: (userData) => userData.jobActivity === 'desk'
  },
  {
    text: "Strength train 2-3x/week minimum to preserve muscle during weight loss.",
    category: 'exercise',
    relevantFor: (userData) => userData.goal === 'lose'
  },
  
  // Nutrition Tips
  {
    text: "Protein at every meal: Aim for 0.8-1g per pound of body weight daily.",
    category: 'nutrition',
  },
  {
    text: "Fiber keeps you full: Women need 25g, men need 35g daily.",
    category: 'nutrition',
  },
  {
    text: "Track for 1 week to understand your eating patterns - awareness is key.",
    category: 'nutrition',
  },
  {
    text: "Liquid calories add up fast - a single latte can be 200+ calories.",
    category: 'nutrition',
    relevantFor: (userData) => userData.goal === 'lose'
  },
  {
    text: "Add olive oil or nuts to meals for easy healthy calories.",
    category: 'nutrition',
    relevantFor: (userData) => userData.goal === 'gain'
  },
  
  // Lifestyle Tips
  {
    text: "Park farther away - those extra steps add up to 50+ calories daily.",
    category: 'lifestyle',
    relevantFor: (userData) => userData.steps < 8000
  },
  {
    text: "Stand for 5 minutes every hour - burns 50% more calories than sitting.",
    category: 'lifestyle',
    relevantFor: (userData) => userData.jobActivity === 'desk'
  },
  {
    text: "Meal prep on Sundays - you're 3x more likely to hit your goals.",
    category: 'lifestyle',
  },
  {
    text: "Sleep 7-9 hours - poor sleep increases hunger hormones by 15%.",
    category: 'lifestyle',
  },
  {
    text: "Take the stairs - burns 15 calories per flight climbed.",
    category: 'lifestyle',
    relevantFor: (userData) => userData.jobActivity === 'desk' || userData.jobActivity === 'standing'
  },
  
  // Goal-Specific Tips
  {
    text: "For fat loss: Create a 300-500 calorie deficit, not 1000+.",
    category: 'goal-specific',
    relevantFor: (userData) => userData.goal === 'lose'
  },
  {
    text: "For muscle gain: Surplus of 200-300 calories prevents excess fat gain.",
    category: 'goal-specific',
    relevantFor: (userData) => userData.goal === 'gain'
  },
  {
    text: "Weigh yourself same time daily - morning, after bathroom, before eating.",
    category: 'goal-specific',
  },
  {
    text: "Focus on trends, not daily fluctuations - water weight varies 2-5lbs.",
    category: 'goal-specific',
  },
  {
    text: "Take progress photos weekly - the scale doesn't show everything.",
    category: 'goal-specific',
  }
];

export default function QuickTips({ userData }: { userData: UserData }) {
  const [currentTip, setCurrentTip] = useState<Tip | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  // Get time-appropriate and relevant tips
  const getRelevantTips = () => {
    const hour = new Date().getHours();
    const isMorning = hour >= 5 && hour < 12;
    const isEvening = hour >= 18 && hour < 23;
    
    return tips.filter(tip => {
      // Check if tip is relevant for user
      if (tip.relevantFor && !tip.relevantFor(userData)) {
        return false;
      }
      
      // Prioritize time-based tips
      if (isMorning && tip.category === 'morning') return true;
      if (isEvening && tip.category === 'evening') return true;
      
      // Include other relevant tips
      return tip.category !== 'morning' && tip.category !== 'evening';
    });
  };

  useEffect(() => {
    const relevantTips = getRelevantTips();
    if (relevantTips.length > 0) {
      setCurrentTip(relevantTips[0]);
    }
  }, [userData]);

  const rotateTip = () => {
    setIsRotating(true);
    const relevantTips = getRelevantTips();
    const nextIndex = (tipIndex + 1) % relevantTips.length;
    setTipIndex(nextIndex);
    
    setTimeout(() => {
      setCurrentTip(relevantTips[nextIndex]);
      setIsRotating(false);
    }, 300);
  };

  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return Sun;
    if (hour >= 18 && hour < 23) return Moon;
    return Clock;
  };

  const TimeIcon = getTimeIcon();

  if (!currentTip) return null;

  return (
    <aside aria-label="Quick tip" className="border border-border bg-background/60 rounded-[3px]">
      <div className="flex items-center justify-between gap-3 border-b border-border pl-3 sm:pl-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lightbulb className="w-4 h-4 text-accent-ink" />
          <h4 className="label-caps text-foreground">Quick Tip</h4>
          <TimeIcon className="w-3.5 h-3.5" />
        </div>

        <button
          type="button"
          onClick={rotateTip}
          className="group inline-flex items-center justify-center w-11 h-11 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Next tip"
        >
          <RefreshCw className={`w-4 h-4 transition-transform ${
            isRotating ? 'animate-spin' : 'group-hover:rotate-180'
          }`} />
        </button>
      </div>

      <div className="px-3 sm:px-4 py-3 min-h-[5.5rem]" aria-live="polite">
        {!isRotating && currentTip && (
          <div key={currentTip.text} className="lab-enter">
            <p className="text-sm text-foreground leading-relaxed">
              {currentTip.text}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="label-caps text-muted-foreground bg-muted px-1.5 py-0.5 rounded-[2px]">
                {currentTip.category.replace('-', ' ')}
              </span>
              {userData.goal && currentTip.relevantFor && (
                <span className="label-caps text-foreground border border-border px-1.5 py-0.5 rounded-[2px]">
                  Personalized for you
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
