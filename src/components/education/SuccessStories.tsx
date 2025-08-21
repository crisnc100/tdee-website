'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Quote, ChevronLeft, ChevronRight, Target, Clock, TrendingDown } from 'lucide-react';
import { UserData } from '@/types/calculator';

interface Story {
  profile: string;
  age: number;
  gender: string;
  activity: string;
  goal: string;
  tdee: number;
  approach: string;
  result: string;
  timeframe: string;
  tips: string[];
  similar?: (userData: UserData) => boolean;
}

const stories: Story[] = [
  {
    profile: "Sarah, 28, Office Worker",
    age: 28,
    gender: "female",
    activity: "Light exercise 3x/week",
    goal: "Lose 15 lbs",
    tdee: 1850,
    approach: "Ate 1600 calories daily with 40% protein",
    result: "Lost 16 lbs in 12 weeks",
    timeframe: "3 months",
    tips: [
      "Meal prepped on Sundays",
      "Walked 8,000 steps daily",
      "Focused on protein at every meal"
    ],
    similar: (userData) => 
      userData.gender === 'female' && 
      userData.age >= 25 && userData.age <= 35 &&
      userData.jobActivity === 'desk'
  },
  {
    profile: "Mike, 35, Construction Worker",
    age: 35,
    gender: "male",
    activity: "Physical job + gym 4x/week",
    goal: "Build muscle",
    tdee: 3200,
    approach: "Ate 3500 calories with progressive overload training",
    result: "Gained 8 lbs muscle in 16 weeks",
    timeframe: "4 months",
    tips: [
      "Never skipped post-workout meals",
      "Tracked protein religiously (1g/lb)",
      "Prioritized sleep (8+ hours)"
    ],
    similar: (userData) => 
      userData.gender === 'male' && 
      (userData.jobActivity === 'physical' || userData.jobActivity === 'heavy_physical')
  },
  {
    profile: "Jennifer, 42, Teacher",
    age: 42,
    gender: "female",
    activity: "Moderate - on feet all day",
    goal: "Maintain weight, improve energy",
    tdee: 2100,
    approach: "Balanced macros, consistent meal timing",
    result: "Maintained weight, energy improved 40%",
    timeframe: "2 months",
    tips: [
      "Ate breakfast every day",
      "Healthy snacks between classes",
      "Hydrated constantly (3L water/day)"
    ],
    similar: (userData) => 
      userData.gender === 'female' && 
      userData.age >= 38 && userData.age <= 48 &&
      (userData.jobActivity === 'standing' || userData.jobActivity === 'walking')
  },
  {
    profile: "David, 50, Remote Developer",
    age: 50,
    gender: "male",
    activity: "Sedentary with evening walks",
    goal: "Lose belly fat",
    tdee: 2000,
    approach: "1750 calories, low-carb approach",
    result: "Lost 4 inches waist in 10 weeks",
    timeframe: "2.5 months",
    tips: [
      "Standing desk for 4 hours/day",
      "10-minute walks every 2 hours",
      "Cut liquid calories completely"
    ],
    similar: (userData) => 
      userData.gender === 'male' && 
      userData.age >= 45 &&
      userData.jobActivity === 'desk' &&
      userData.steps < 7000
  },
  {
    profile: "Amy, 23, College Student",
    age: 23,
    gender: "female",
    activity: "Gym 5x/week, very active",
    goal: "Lean bulk",
    tdee: 2400,
    approach: "2650 calories, strength training focus",
    result: "Gained 5 lbs, increased lifts 20%",
    timeframe: "3 months",
    tips: [
      "Liquid calories for easier intake",
      "Progressive overload every session",
      "Tracked measurements, not just weight"
    ],
    similar: (userData) => 
      userData.age >= 18 && userData.age <= 25 &&
      userData.exercises && userData.exercises.length >= 4
  }
];

export default function SuccessStories({ userData }: { userData?: UserData }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Find the most relevant story if userData is provided
  const relevantStory = userData 
    ? stories.find(story => story.similar && story.similar(userData)) || stories[0]
    : stories[0];
    
  const currentStory = stories[currentIndex];
  
  const nextStory = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };
  
  const prevStory = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-amber-50 rounded-xl p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Success Stories</h3>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={prevStory}
            className="p-1 hover:bg-white/50 rounded-lg transition-colors"
            aria-label="Previous story"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={nextStory}
            className="p-1 hover:bg-white/50 rounded-lg transition-colors"
            aria-label="Next story"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {userData && relevantStory !== currentStory && currentIndex === 0 && (
        <div className="mb-3 p-2 bg-amber-100 rounded-lg border border-amber-300">
          <p className="text-xs text-amber-800">
            💡 We found a story similar to your profile! Check out {relevantStory.profile.split(',')[0]}'s journey.
          </p>
        </div>
      )}

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Profile Header */}
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-bold text-gray-900">{currentStory.profile}</h4>
            <p className="text-sm text-gray-600">{currentStory.activity}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-blue-600">TDEE: {currentStory.tdee} cal</p>
            <p className="text-xs text-gray-500">{currentStory.timeframe}</p>
          </div>
        </div>

        {/* Goal & Result */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/70 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Target className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-semibold text-gray-700">Goal</p>
            </div>
            <p className="text-sm text-gray-900">{currentStory.goal}</p>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="w-4 h-4 text-green-600" />
              <p className="text-xs font-semibold text-green-700">Result</p>
            </div>
            <p className="text-sm font-medium text-green-900">{currentStory.result}</p>
          </div>
        </div>

        {/* Approach */}
        <div className="p-3 bg-white/70 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 mb-1">Approach:</p>
          <p className="text-sm text-gray-800">{currentStory.approach}</p>
        </div>

        {/* Tips */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-1 mb-2">
            <Quote className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-semibold text-blue-900">Key Success Factors:</p>
          </div>
          <ul className="space-y-1">
            {currentStory.tips.map((tip, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-start gap-1">
                <span className="text-blue-500 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Story indicator */}
        <div className="flex justify-center gap-1 pt-2">
          {stories.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex 
                  ? 'w-6 bg-blue-600' 
                  : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}