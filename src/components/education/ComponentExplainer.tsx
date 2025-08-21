'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        className="ml-1 p-0.5 text-gray-400 hover:text-amber-600 transition-colors"
        aria-label={`Learn more about ${info.title}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {showTooltip && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setShowTooltip(false)}
            />

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-5"
            >
              {/* Arrow */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white border-r border-b border-gray-200 rotate-45" />
              
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{info.title}</h4>
                    <p className="text-xs text-gray-500">{info.short}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTooltip(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {info.detailed}
                </p>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-semibold text-amber-900 mb-1">Why This Matters:</p>
                  <p className="text-sm text-amber-800">
                    {info.whyItMatters}
                  </p>
                </div>

                {value && (
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Your contribution: <span className="font-bold text-gray-900">{value} calories/day</span>
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Quick Facts:</p>
                  <ul className="space-y-1">
                    {info.tips.map((tip, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}