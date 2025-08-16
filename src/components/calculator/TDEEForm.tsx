'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserData, Exercise } from '@/types/calculator';
import { Calculator, Plus, Trash2, Info, Eye, EyeOff, X } from 'lucide-react';

interface TDEEFormProps {
  userData: UserData;
  onChange: (data: UserData) => void;
  onCalculate: () => void;
}

const intensityDescriptions = {
  weight_lifting: [
    { value: 'light', label: 'Normal', description: 'Standard lifting pace' },
    { value: 'moderate', label: 'Hypertrophy', description: 'Feeling it, controlled reps' },
    { value: 'vigorous', label: 'Heavy', description: 'Low reps, high weight, strength focus' }
  ],
  cardio: [
    { value: 'light', label: 'Light', description: 'Chill pace, can chat easily' },
    { value: 'moderate', label: 'Moderate', description: 'Solid effort, breathing up' },
    { value: 'vigorous', label: 'Heavy', description: 'Pushing hard, maxed out' }
  ],
  hiit: [
    { value: 'light', label: 'Light', description: 'Casual pace, some breaks' },
    { value: 'moderate', label: 'Moderate', description: 'Steady intervals, working' },
    { value: 'vigorous', label: 'Heavy', description: 'All-out, intense bursts' }
  ],
  yoga: [
    { value: 'light', label: 'Light', description: 'Gentle, relaxing' },
    { value: 'moderate', label: 'Moderate', description: 'Some effort, holding poses' },
    { value: 'vigorous', label: 'Heavy', description: 'Power yoga, continuous flow' }
  ],
  sports: [
    { value: 'light', label: 'Light', description: 'Casual play, fun vibes' },
    { value: 'moderate', label: 'Moderate', description: 'Competitive, moving a lot' },
    { value: 'vigorous', label: 'Heavy', description: 'Intense matches, all out' }
  ]
};

const bodyFatGuide = {
  male: [
    { range: '5-7%', image: '/assets/images/maleBodyFat/5-7_male.jpg', description: 'Essential fat only, extreme definition' },
    { range: '8-9%', image: '/assets/images/maleBodyFat/8_male.jpg', description: 'Competition ready, very defined' },
    { range: '10-12%', image: '/assets/images/maleBodyFat/9-11_male.jpg', description: 'Athletic, visible abs, good definition' },
    { range: '13-15%', image: '/assets/images/maleBodyFat/13-15_male.jpg', description: 'Fit, some ab definition, healthy range' },
    { range: '18-20%', image: '/assets/images/maleBodyFat/18-20_male.jpg', description: 'Average fitness, minimal definition' },
    { range: '25%+', image: '/assets/images/maleBodyFat/25_male.jpg', description: 'Higher body fat, less definition' }
  ],
  female: [
    { range: '10-12%', image: '/assets/images/femaleBodyFat/10-12_female.jpg', description: 'Essential fat, competition ready' },
    { range: '14-16%', image: '/assets/images/femaleBodyFat/14-16_female.jpg', description: 'Athletic, very fit, good definition' },
    { range: '18-20%', image: '/assets/images/femaleBodyFat/18-20_female.jpg', description: 'Fit, healthy athletic range' },
    { range: '22-24%', image: '/assets/images/femaleBodyFat/22-24_female.jpg', description: 'Average fitness, healthy range' },
    { range: '30%', image: '/assets/images/femaleBodyFat/30_female.jpg', description: 'Above average body fat' },
    { range: '35%+', image: '/assets/images/femaleBodyFat/35_female.jpg', description: 'Higher body fat percentage' }
  ]
};

export default function TDEEForm({ userData, onChange, onCalculate }: TDEEFormProps) {
  const [showErrorMarginInfo, setShowErrorMarginInfo] = useState(false);
  const [showBodyFatGuide, setShowBodyFatGuide] = useState(false);
  const [selectedBodyFatImage, setSelectedBodyFatImage] = useState<{range: string, image: string, description: string} | null>(null);

  const handleInputChange = (field: keyof UserData, value: any) => {
    onChange({ ...userData, [field]: value });
  };

  const addExercise = () => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      type: 'weight_lifting',
      intensity: 'moderate',
      minutes: 60,
      frequency: 3
    };
    
    const exercises = userData.exercises || [];
    onChange({
      ...userData,
      exercises: [...exercises, newExercise]
    });
  };

  const removeExercise = (id: string) => {
    const exercises = userData.exercises || [];
    onChange({
      ...userData,
      exercises: exercises.filter(ex => ex.id !== id)
    });
  };

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    const exercises = userData.exercises || [];
    const updatedExercises = exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    );
    onChange({
      ...userData,
      exercises: updatedExercises
    });
  };

  const handleUnitsChange = (newUnits: 'metric' | 'imperial') => {
    let convertedWeight = userData.weight;
    let convertedHeight = userData.height;
    let heightFeet = userData.heightFeet || 0;
    let heightInches = userData.heightInches || 0;

    if (userData.units === 'metric' && newUnits === 'imperial') {
      // Convert kg to lbs, cm to total inches, then split into feet/inches
      convertedWeight = Math.round(userData.weight * 2.20462 * 10) / 10;
      const totalInches = Math.round(userData.height / 2.54);
      convertedHeight = totalInches;
      heightFeet = Math.floor(totalInches / 12);
      heightInches = totalInches % 12;
    } else if (userData.units === 'imperial' && newUnits === 'metric') {
      // Convert lbs to kg, total inches to cm
      convertedWeight = Math.round(userData.weight / 2.20462 * 10) / 10;
      convertedHeight = Math.round(userData.height * 2.54);
      heightFeet = 0;
      heightInches = 0;
    }

    onChange({
      ...userData,
      units: newUnits,
      weight: convertedWeight,
      height: convertedHeight,
      heightFeet,
      heightInches,
    });
  };

  const handleHeightChange = (feet: number, inches: number) => {
    const totalInches = feet * 12 + inches;
    onChange({
      ...userData,
      height: totalInches,
      heightFeet: feet,
      heightInches: inches,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Phase 1: Foundation (Required) */}
      <div className="space-y-6">
        <div className="border-l-4 border-orange-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Phase 1: Foundation</h3>
          <p className="text-sm text-gray-600">Core requirements for BMR calculation</p>
        </div>

        {/* 1. Units Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Units System
          </label>
          <div className="flex justify-center">
            <div className="bg-gray-200 rounded-lg p-1 flex w-fit">
              <button
                type="button"
                onClick={() => handleUnitsChange('metric')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  userData.units === 'metric'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'
                }`}
              >
                Metric (kg/cm)
              </button>
              <button
                type="button"
                onClick={() => handleUnitsChange('imperial')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  userData.units === 'imperial'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'
                }`}
              >
                Imperial (lbs/in)
              </button>
            </div>
          </div>
        </div>

        {/* 2. Basic Demographics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <input
              type="number"
              value={userData.age || ''}
              onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : 0)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              min="15"
              max="80"
              placeholder="e.g., 30"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              value={userData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height {userData.units === 'metric' ? '(cm)' : '(feet & inches)'}
            </label>
            {userData.units === 'metric' ? (
              <input
                type="number"
                value={userData.height || ''}
                onChange={(e) => handleInputChange('height', e.target.value ? parseInt(e.target.value) : 0)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                min="120"
                max="220"
                step="1"
                placeholder="e.g., 175"
                required
              />
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={userData.heightFeet === 0 ? '' : userData.heightFeet || ''}
                    onChange={(e) => {
                      const feet = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                      handleHeightChange(feet, userData.heightInches || 0);
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    min="4"
                    max="7"
                    placeholder="5"
                    required
                  />
                  <label className="block text-xs text-gray-500 mt-1 text-center">feet</label>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={userData.heightInches === 0 ? '' : userData.heightInches || ''}
                    onChange={(e) => {
                      const inches = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                      handleHeightChange(userData.heightFeet || 0, inches);
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    min="0"
                    max="11"
                    placeholder="9"
                    required
                  />
                  <label className="block text-xs text-gray-500 mt-1 text-center">inches</label>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight ({userData.units === 'metric' ? 'kg' : 'lbs'})
            </label>
            <input
              type="number"
              value={userData.weight || ''}
              onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              min={userData.units === 'metric' ? "30" : "66"}
              max={userData.units === 'metric' ? "200" : "440"}
              step="0.1"
              placeholder={userData.units === 'metric' ? "e.g., 70" : "e.g., 154"}
              required
            />
          </div>
        </div>
      </div>

      {/* Phase 2: Lifestyle Context (Required) */}
      <div className="space-y-6">
        <div className="border-l-4 border-orange-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Phase 2: Lifestyle Context</h3>
          <p className="text-sm text-gray-600">Daily occupational and movement patterns</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Activity Level
            </label>
            <select
              value={userData.jobActivity}
              onChange={(e) => handleInputChange('jobActivity', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            >
              <option value="desk">Desk Job (mostly sitting)</option>
              <option value="standing">Standing Job (retail, teaching)</option>
              <option value="walking">Walking Job (nurse, server)</option>
              <option value="physical">Physical Job (construction)</option>
              <option value="heavy_physical">Heavy Physical Job (manual labor)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Steps
            </label>
            <input
              type="number"
              value={userData.steps}
              onChange={(e) => handleInputChange('steps', parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              min="1000"
              max="30000"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Average daily steps from phone/watch
            </p>
          </div>
        </div>
      </div>

      {/* Phase 3: Exercise Details (Required) */}
      <div className="space-y-6">
        <div className="border-l-4 border-orange-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Phase 3: Exercise Details</h3>
          <p className="text-sm text-gray-600">Choose your preferred tracking method</p>
        </div>

        {/* Exercise Input Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exercise Input Method
          </label>
          <div className="flex justify-center">
            <div className="bg-gray-200 rounded-lg p-1 flex w-fit">
              <button
                type="button"
                onClick={() => handleInputChange('calculatorMode', 'simple')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  userData.calculatorMode === 'simple'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'
                }`}
              >
                Simple (Preset Levels)
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('calculatorMode', 'advanced')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  userData.calculatorMode === 'advanced'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'
                }`}
              >
                Advanced (Detailed)
              </button>
            </div>
          </div>
        </div>

        {/* Simple Exercise Input */}
        {userData.calculatorMode === 'simple' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exercise Level
            </label>
            <select
              value={userData.simpleExerciseLevel || 'none'}
              onChange={(e) => handleInputChange('simpleExerciseLevel', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            >
              <option value="none">No regular exercise</option>
              <option value="very_light">Very Light - 1 light exercise a week</option>
              <option value="light">Light - 1-2 sessions per week</option>
              <option value="moderate">Moderate - 2-3 sessions per week</option>
              <option value="active">Active - 3-5 sessions per week</option>
              <option value="very_active">Very Active - 5+ intense sessions per week</option>
            </select>
          </div>
        )}

        {/* Advanced Exercise Input */}
        {userData.calculatorMode === 'advanced' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Exercises List */}
            <div className="space-y-4">
              {(userData.exercises || []).map((exercise, index) => (
                <div key={exercise.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Exercise {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeExercise(exercise.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={exercise.type}
                        onChange={(e) => updateExercise(exercise.id, 'type', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="weight_lifting">Weight Lifting</option>
                        <option value="cardio">Cardio</option>
                        <option value="hiit">HIIT</option>
                        <option value="yoga">Yoga</option>
                        <option value="sports">Sports</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Intensity</label>
                      <select
                        value={exercise.intensity}
                        onChange={(e) => updateExercise(exercise.id, 'intensity', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {intensityDescriptions[exercise.type].map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {intensityDescriptions[exercise.type].find(opt => opt.value === exercise.intensity)?.description}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Minutes/Session</label>
                      <input
                        type="number"
                        value={exercise.minutes}
                        onChange={(e) => updateExercise(exercise.id, 'minutes', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="5"
                        max="300"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Days/Week</label>
                      <input
                        type="number"
                        value={exercise.frequency}
                        onChange={(e) => updateExercise(exercise.id, 'frequency', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="1"
                        max="7"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Exercise Button */}
              <button
                type="button"
                onClick={addExercise}
                className="w-full py-3 px-4 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:border-orange-400 hover:text-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Exercise Type
              </button>
            </div>

          </motion.div>
        )}
      </div>

      {/* Phase 4: Optimization (Optional but Important) */}
      <div className="space-y-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
        <div className="border-l-4 border-orange-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Phase 4: Optimization</h3>
          <p className="text-sm text-gray-600">Optional settings for enhanced accuracy</p>
        </div>

        {/* Body Fat Percentage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Body Fat % (optional - improves accuracy)
            </label>
            <button
              type="button"
              onClick={() => setShowBodyFatGuide(!showBodyFatGuide)}
              className="flex items-center gap-2 px-3 py-1 text-sm text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              {showBodyFatGuide ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showBodyFatGuide ? 'Hide' : 'Show'} Visual Guide
            </button>
          </div>
          
          <input
            type="number"
            value={userData.bodyFat || ''}
            onChange={(e) => handleInputChange('bodyFat', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            min="5"
            max="50"
            step="0.1"
            placeholder="e.g., 15"
          />
          
          <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>Accuracy boost:</strong> Adding body fat reduces error margin from ±15% to ±10% by enabling the Katch-McArdle formula.
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Only add if you have a close estimate from DEXA, BodPod, or calipers. Don't guess - leave empty if unsure.
            </p>
          </div>

          {/* Visual Body Fat Guide */}
          {showBodyFatGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-4 bg-white rounded-lg border border-gray-200"
            >
              <h4 className="font-medium text-gray-900 mb-3 text-center">
                Body Fat Percentage Visual Guide - {userData.gender === 'male' ? 'Male' : 'Female'}
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {bodyFatGuide[userData.gender].map((item, index) => (
                  <div key={index} className="text-center">
                    <div 
                      className="relative mb-2 cursor-pointer" 
                      onClick={() => setSelectedBodyFatImage(item)}
                    >
                      <img
                        src={item.image}
                        alt={`${userData.gender} ${item.range} body fat`}
                        className="w-full h-32 object-cover rounded-lg shadow-sm hover:opacity-80 transition-opacity"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
                        {item.range}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-lg pointer-events-none">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-tight">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  <strong>Note:</strong> These are visual approximations. For accuracy, use professional measurement methods (DEXA, BodPod, calipers).
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Error Margin Preference */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Error Margin Preference
            </label>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowErrorMarginInfo(true)}
                onMouseLeave={() => setShowErrorMarginInfo(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
              {showErrorMarginInfo && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  <p className="font-medium mb-1">What is Error Margin?</p>
                  <p>TDEE calculations are estimates. Error margin shows the range your actual TDEE might fall within. Lower = tighter range but may miss individual variations. Higher = wider safety buffer.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conservative (safer)</span>
              <span className="text-sm text-gray-600">Precise (tighter)</span>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="3"
                max="12"
                step="1"
                value={userData.errorMarginPreference || 7}
                onChange={(e) => handleInputChange('errorMarginPreference', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${((userData.errorMarginPreference || 7) - 3) * 11.11}%, #e5e7eb ${((userData.errorMarginPreference || 7) - 3) * 11.11}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>3%</span>
                <span>7%</span>
                <span>12%</span>
              </div>
            </div>
            
            <div className="text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                ±{userData.errorMarginPreference || 7}% Error Margin
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {userData.errorMarginPreference === 3 && "Very tight range - for precise trackers"}
                {userData.errorMarginPreference === 7 && "Recommended - good balance of accuracy and safety"}
                {userData.errorMarginPreference === 12 && "Wide range - safer buffer for casual tracking"}
                {(userData.errorMarginPreference && ![3, 7, 12].includes(userData.errorMarginPreference)) && "Custom range selected"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 hover:from-orange-600 hover:to-orange-700 cursor-pointer"
      >
        <Calculator className="w-5 h-5" />
        Calculate My TDEE
      </motion.button>

      {/* Body Fat Image Modal */}
      {selectedBodyFatImage && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setSelectedBodyFatImage(null)}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto relative shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedBodyFatImage(null)}
              className="absolute top-4 right-4 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-full p-2 z-10 shadow-lg border border-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Large Image */}
            <div className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedBodyFatImage.range} Body Fat
                </h3>
                <p className="text-lg text-gray-600">
                  {userData.gender === 'male' ? 'Male' : 'Female'} Reference
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6">
                <img
                  src={selectedBodyFatImage.image}
                  alt={`${userData.gender} ${selectedBodyFatImage.range} body fat`}
                  className="w-full h-96 object-contain rounded-lg"
                />
              </div>
              
              {/* Image Info */}
              <div className="space-y-4">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {selectedBodyFatImage.description}
                </p>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-orange-800">
                    <strong>💡 Tip:</strong> If this looks similar to your physique, you can use this range as an estimate for more accurate TDEE calculations.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </form>
  );
}