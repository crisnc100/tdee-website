'use client';

import { useState } from 'react';
import { HelpCircle, X, Brain, Activity, Zap, Dumbbell, Cookie, TrendingUp } from 'lucide-react';

interface ExplainerTooltipProps {
  component: 'bmr' | 'neat' | 'exercise' | 'tef' | 'muscle' | 'job';
  value?: number;
}

const explanations = {
  bmr: {
    title: 'Basal Metabolic Rate (BMR)',
    icon: Brain,
    short: 'Calories burned at complete rest',
    detailed: 'Your BMR represents the minimum energy your body needs to function - breathing, circulating blood, cell production, and nutrient processing. It accounts for 60-75% of your daily calorie burn.',
    whyItMatters: 'Understanding your BMR helps you know your absolute minimum calorie needs. Eating below this for extended periods can slow metabolism and cause muscle loss.',
    tips: [
      'BMR decreases with age (about 2% per decade after 20)',
      'More muscle mass increases BMR',
      'Extreme dieting can lower BMR by up to 20%'
    ]
  },
  neat: {
    title: 'NEAT (Daily Movement)',
    icon: Activity,
    short: 'Calories from daily activities',
    detailed: 'Non-Exercise Activity Thermogenesis includes all movement that isn\'t formal exercise - walking, fidgeting, standing, typing. Can vary by 2000+ calories between sedentary and active jobs.',
    whyItMatters: 'NEAT is the most variable component and easiest to increase. Simply taking the stairs or parking farther away can burn an extra 200-300 calories daily.',
    tips: [
      '10,000 steps burns ~400-500 calories',
      'Standing desk: +50 cal/hour vs sitting',
      'Fidgeting can burn 350 cal/day'
    ]
  },
  exercise: {
    title: 'Exercise Activity',
    icon: Dumbbell,
    short: 'Calories from workouts',
    detailed: 'Structured physical activity including gym sessions, sports, running, etc. The actual burn depends on intensity, duration, and your fitness level.',
    whyItMatters: 'While exercise burns calories, people often overestimate the amount. A 30-minute run might burn 300 calories, easily replaced by a single muffin.',
    tips: [
      'Weight training continues burning calories 24-48h post-workout',
      'HIIT burns more in less time',
      'Fitness trackers often overestimate by 20-30%'
    ]
  },
  tef: {
    title: 'Thermic Effect of Food',
    icon: Cookie,
    short: 'Calories to digest food',
    detailed: 'Your body uses energy to digest, absorb, and process nutrients. Protein requires 20-30% of its calories to digest, carbs 5-10%, fats 0-3%.',
    whyItMatters: 'High-protein diets naturally burn more calories through digestion. This is why 100 calories of chicken has a different net effect than 100 calories of butter.',
    tips: [
      'Protein: 20-30% TEF',
      'Carbs: 5-10% TEF',
      'Fats: 0-3% TEF',
      'Processed foods have lower TEF'
    ]
  },
  muscle: {
    title: 'Muscle Factor',
    icon: Zap,
    short: 'Metabolic boost from muscle mass',
    detailed: 'Each pound of muscle burns 6-10 calories per day at rest, while fat burns 2-3. Athletes and muscular individuals can have 5-10% higher metabolism.',
    whyItMatters: 'Building muscle is a long-term investment in metabolism. Even a 5lb muscle gain means 30-50 extra calories burned daily without trying.',
    tips: [
      '1lb muscle burns 6-10 cal/day at rest',
      '1lb fat burns 2-3 cal/day',
      'Muscle recovery increases calorie burn for 48h'
    ]
  },
  job: {
    title: 'Occupational Activity',
    icon: TrendingUp,
    short: 'Calories from your job type',
    detailed: 'Your occupation significantly impacts daily burn. Construction workers can burn 400+ more calories than office workers during work hours alone.',
    whyItMatters: 'Job activity is often overlooked but crucial. A nurse walking hospital halls burns 200-300 more calories than a programmer, requiring different nutrition strategies.',
    tips: [
      'Desk job: +50 cal/day',
      'Teacher/retail: +200 cal/day',
      'Construction: +400 cal/day',
      'Take walking meetings when possible'
    ]
  }
};


export default function ComponentExplainer({ component, value }: ExplainerTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const info = explanations[component];
  const Icon = info.icon;
  const panelId = `explainer-${component}`;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        className="inline-flex items-center justify-center w-11 h-11 -my-3 text-muted-foreground hover:text-accent-ink transition-colors cursor-pointer"
        aria-label={`Learn more about ${info.title}`}
        aria-expanded={showTooltip}
        aria-controls={showTooltip ? panelId : undefined}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {showTooltip && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-background/70 z-40 md:hidden"
            onClick={() => setShowTooltip(false)}
          />

          {/* Bottom sheet on mobile, popover above the button from md up */}
          <div
            id={panelId}
            role="dialog"
            aria-label={info.title}
            className="panel fixed inset-x-3 bottom-3 max-h-[80vh] overflow-auto z-50 p-4 sm:p-5 shadow-2xl lab-enter md:absolute md:inset-x-auto md:bottom-full md:left-1/2 md:-translate-x-1/2 md:mb-1 md:w-96 md:max-h-none md:overflow-visible"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="inline-flex items-center justify-center w-9 h-9 shrink-0 border border-border bg-muted rounded-[2px] text-accent-ink">
                  <Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h4 className="label-caps text-foreground">{info.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{info.short}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTooltip(false)}
                aria-label="Close"
                className="inline-flex items-center justify-center w-11 h-11 -mr-2 -mt-2 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-[2px] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <p className="text-sm text-foreground leading-relaxed">
                {info.detailed}
              </p>

              <div className="border-l-2 border-accent-ink bg-muted/70 px-3 py-2.5">
                <p className="label-caps text-foreground mb-1">Why This Matters:</p>
                <p className="text-sm text-foreground">
                  {info.whyItMatters}
                </p>
              </div>

              {!!value && (
                <p className="flex items-baseline justify-between gap-3 border border-border px-3 py-2 text-sm text-muted-foreground">
                  Your contribution:{' '}
                  <span className="readout font-semibold text-foreground">{value} calories/day</span>
                </p>
              )}

              <div className="pt-3 border-t border-border">
                <p className="label-caps text-muted-foreground mb-2">Quick Facts:</p>
                <ul className="space-y-1">
                  {info.tips.map((tip, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span aria-hidden="true" className="font-mono text-accent-ink">—</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
