'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { UserData, Exercise } from '@/types/calculator';
import { Plus, Trash2, Info, Eye, EyeOff, X } from 'lucide-react';
import { Reticle, Segmented, SectionHeading } from '@/components/ui/lab';

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

  // Track field interaction to avoid showing errors prematurely
  const [touched, setTouched] = useState({
    age: false,
    heightCm: false,
    heightFeet: false,
    heightInches: false,
    weight: false,
    steps: false,
    bodyFat: false,
  });
  const [submitted, setSubmitted] = useState(false);

  // Inline validation helpers
  const invalidAge = userData.age < 15 || userData.age > 80;
  const invalidHeightMetric = userData.units === 'metric' && (userData.height < 120 || userData.height > 220);
  const invalidHeightFeet = userData.units === 'imperial' && ((userData.heightFeet ?? 0) < 4 || (userData.heightFeet ?? 0) > 7);
  const invalidHeightInches = userData.units === 'imperial' && ((userData.heightInches ?? 0) < 0 || (userData.heightInches ?? 0) > 11);
  const invalidWeightMetric = userData.units === 'metric' && (userData.weight < 30 || userData.weight > 200);
  const invalidWeightImperial = userData.units === 'imperial' && (userData.weight < 66 || userData.weight > 440);
  const invalidSteps = userData.steps < 1000 || userData.steps > 30000;

  // Show errors only if field was interacted with or after submit attempt
  const showAgeError = (touched.age || submitted) && invalidAge;
  const showHeightMetricError = (touched.heightCm || submitted) && invalidHeightMetric;
  const showHeightFeetError = (touched.heightFeet || submitted) && invalidHeightFeet;
  const showHeightInchesError = (touched.heightInches || submitted) && invalidHeightInches;
  const showWeightError = (touched.weight || submitted) && ((userData.units === 'metric' ? invalidWeightMetric : invalidWeightImperial));
  const showStepsError = (touched.steps || submitted) && invalidSteps;

  const handleInputChange = <K extends keyof UserData>(field: K, value: UserData[K]) => {
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

  const updateExercise = <K extends keyof Exercise>(id: string, field: K, value: Exercise[K]) => {
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
    setSubmitted(true);
    const heightInvalid = userData.units === 'metric' ? invalidHeightMetric : (invalidHeightFeet || invalidHeightInches);
    const weightInvalid = userData.units === 'metric' ? invalidWeightMetric : invalidWeightImperial;
    const bodyFatInvalid = userData.bodyFat !== undefined && (userData.bodyFat < 5 || userData.bodyFat > 50);
    const hasInvalid = invalidAge || heightInvalid || weightInvalid || invalidSteps || bodyFatInvalid;
    if (hasInvalid) {
      return; // Show errors; do not calculate
    }
    onCalculate();
  };

  const marginPct = userData.errorMarginPreference || 7;
  const bodyFatOutOfRange = !!userData.bodyFat && (userData.bodyFat < 5 || userData.bodyFat > 50);

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Phase 1: Foundation (Required) */}
      <section className="space-y-6">
        <SectionHeading index="Phase 01" title="Foundation" hint="Core requirements for BMR calculation" />

        {/* 1. Units Selection */}
        <div>
          <p id="units-label" className={labelClass}>
            Units System
          </p>
          <Segmented
            labelledBy="units-label"
            value={userData.units}
            onSelect={handleUnitsChange}
            options={[
              { value: 'metric', label: 'Metric', detail: 'kg / cm' },
              { value: 'imperial', label: 'Imperial', detail: 'lbs / in' },
            ]}
          />
        </div>

        {/* 2. Basic Demographics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="age" className={labelClass}>
              Age
            </label>
            <div className="flex">
              <input
                type="number"
                value={userData.age || ''}
                onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : 0)}
                id="age"
                inputMode="numeric"
                onBlur={() => setTouched((t) => ({ ...t, age: true }))}
                aria-invalid={showAgeError}
                aria-describedby={showAgeError ? 'age-error' : undefined}
                className={groupedFieldClass}
                min="15"
                max="80"
                placeholder="e.g., 30"
                required
              />
              <UnitCell>yrs</UnitCell>
            </div>
            {showAgeError && (
              <p id="age-error" className={errorClass}>Age must be between 15–80.</p>
            )}
          </div>

          <div>
            <label htmlFor="gender" className={labelClass}>
              Gender
            </label>
            <select
              value={userData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value as UserData['gender'])}
              id="gender"
              className="field"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass} htmlFor={userData.units === 'metric' ? 'height-cm' : 'height-feet'}>
              Height<span className="sr-only"> {userData.units === 'metric' ? '(cm)' : '(feet & inches)'}</span>
            </label>
            {userData.units === 'metric' ? (
              <div className="flex">
                <input
                  type="number"
                  value={userData.height || ''}
                  onChange={(e) => handleInputChange('height', e.target.value ? parseInt(e.target.value) : 0)}
                  id="height-cm"
                  inputMode="numeric"
                  onBlur={() => setTouched((t) => ({ ...t, heightCm: true }))}
                  aria-invalid={showHeightMetricError}
                  aria-describedby={showHeightMetricError ? 'height-error' : undefined}
                  className={groupedFieldClass}
                  min="120"
                  max="220"
                  step="1"
                  placeholder="e.g., 175"
                  required
                />
                <UnitCell>cm</UnitCell>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex">
                    <input
                      type="number"
                      value={userData.heightFeet === 0 ? '' : userData.heightFeet || ''}
                      onChange={(e) => {
                        const feet = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleHeightChange(feet, userData.heightInches || 0);
                      }}
                      id="height-feet"
                      inputMode="numeric"
                      onBlur={() => setTouched((t) => ({ ...t, heightFeet: true }))}
                      aria-invalid={showHeightFeetError}
                      aria-describedby={showHeightFeetError ? 'height-feet-error' : undefined}
                      className={groupedFieldClass}
                      min="4"
                      max="7"
                      placeholder="5"
                      required
                    />
                    <UnitCell>ft</UnitCell>
                  </div>
                  {showHeightFeetError && (
                    <p id="height-feet-error" className={errorClass}>Feet must be between 4–7.</p>
                  )}
                </div>
                <div>
                  <label htmlFor="height-inches" className="sr-only">
                    Height, inches
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      value={userData.heightInches === 0 ? '' : userData.heightInches || ''}
                      onChange={(e) => {
                        const inches = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        handleHeightChange(userData.heightFeet || 0, inches);
                      }}
                      id="height-inches"
                      inputMode="numeric"
                      onBlur={() => setTouched((t) => ({ ...t, heightInches: true }))}
                      aria-invalid={showHeightInchesError}
                      aria-describedby={showHeightInchesError ? 'height-inches-error' : undefined}
                      className={groupedFieldClass}
                      min="0"
                      max="11"
                      placeholder="9"
                      required
                    />
                    <UnitCell>in</UnitCell>
                  </div>
                  {showHeightInchesError && (
                    <p id="height-inches-error" className={errorClass}>Inches must be 0–11.</p>
                  )}
                </div>
              </div>
            )}
            {(showHeightMetricError) && (
              <p id="height-error" className={errorClass}>Height must be between 120–220 cm.</p>
            )}
          </div>

          <div>
            <label htmlFor="weight" className={labelClass}>
              Weight<span className="sr-only"> ({userData.units === 'metric' ? 'kg' : 'lbs'})</span>
            </label>
            <div className="flex">
              <input
                type="number"
                value={userData.weight || ''}
                onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : 0)}
                id="weight"
                inputMode="numeric"
                onBlur={() => setTouched((t) => ({ ...t, weight: true }))}
                aria-invalid={showWeightError}
                aria-describedby={showWeightError ? 'weight-error' : undefined}
                className={groupedFieldClass}
                min={userData.units === 'metric' ? "30" : "66"}
                max={userData.units === 'metric' ? "200" : "440"}
                step="0.1"
                placeholder={userData.units === 'metric' ? "e.g., 70" : "e.g., 154"}
                required
              />
              <UnitCell>{userData.units === 'metric' ? 'kg' : 'lbs'}</UnitCell>
            </div>
            {showWeightError && (
              <p id="weight-error" className={errorClass}>
                {userData.units === 'metric' ? 'Weight must be between 30–200 kg.' : 'Weight must be between 66–440 lbs.'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Phase 2: Lifestyle Context (Required) */}
      <section className="space-y-6">
        <SectionHeading index="Phase 02" title="Lifestyle Context" hint="Daily occupational and movement patterns" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="job-activity" className={labelClass}>
              Job Activity Level
            </label>
            <select
              value={userData.jobActivity}
              onChange={(e) => handleInputChange('jobActivity', e.target.value as UserData['jobActivity'])}
              id="job-activity"
              className="field"
            >
              <option value="desk">Desk Job (mostly sitting)</option>
              <option value="standing">Standing Job (retail, teaching)</option>
              <option value="walking">Walking Job (nurse, server)</option>
              <option value="physical">Physical Job (construction)</option>
              <option value="heavy_physical">Heavy Physical Job (manual labor)</option>
            </select>
          </div>

          <div>
            <label htmlFor="steps" className={labelClass}>
              Daily Steps
            </label>
            <div className="flex">
              <input
                type="number"
                value={userData.steps}
                onChange={(e) => handleInputChange('steps', parseInt(e.target.value))}
                id="steps"
                inputMode="numeric"
                onBlur={() => setTouched((t) => ({ ...t, steps: true }))}
                aria-invalid={showStepsError}
                aria-describedby={showStepsError ? 'steps-error steps-hint' : 'steps-hint'}
                className={groupedFieldClass}
                min="1000"
                max="30000"
                required
              />
              <UnitCell>/ day</UnitCell>
            </div>
            <p id="steps-hint" className={hintClass}>
              Average daily steps from phone/watch
            </p>
            {showStepsError && (
              <p id="steps-error" className={errorClass}>Steps must be between 1,000–30,000.</p>
            )}
          </div>
        </div>
      </section>

      {/* Phase 3: Exercise Details (Required) */}
      <section className="space-y-6">
        <SectionHeading index="Phase 03" title="Exercise Details" hint="Choose your preferred tracking method" />

        {/* Exercise Input Method Selection */}
        <div>
          <p id="exercise-method-label" className={labelClass}>
            Exercise Input Method
          </p>
          <Segmented
            labelledBy="exercise-method-label"
            value={userData.calculatorMode}
            onSelect={(mode) => handleInputChange('calculatorMode', mode)}
            options={[
              { value: 'simple', label: 'Simple', detail: 'Preset levels' },
              { value: 'advanced', label: 'Advanced', detail: 'Detailed' },
            ]}
          />
        </div>

        {/* Simple Exercise Input */}
        {userData.calculatorMode === 'simple' && (
          <div>
            <label htmlFor="simple-exercise-level" className={labelClass}>
              Exercise Level
            </label>
            <select
              value={userData.simpleExerciseLevel || 'none'}
              onChange={(e) => handleInputChange('simpleExerciseLevel', e.target.value as UserData['simpleExerciseLevel'])}
              id="simple-exercise-level"
              className="field"
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
          <div className="space-y-3 lab-enter">
            {(userData.exercises || []).map((exercise, index) => {
              const minutesInvalid = exercise.minutes !== 0 && (exercise.minutes < 5 || exercise.minutes > 300);
              const daysInvalid = exercise.frequency !== 0 && (exercise.frequency < 1 || exercise.frequency > 7);
              return (
                <div key={exercise.id} className="border border-border bg-muted/60 rounded-[3px]">
                  <div className="flex items-center justify-between border-b border-border pl-3">
                    <h4 className="label-caps text-foreground flex items-baseline gap-2">
                      <span aria-hidden="true" className="text-accent-ink">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>Exercise {index + 1}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeExercise(exercise.id)}
                      className="inline-flex items-center justify-center w-11 h-11 text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                      aria-label={`Remove exercise ${index + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3">
                    <div className="col-span-2 md:col-span-1">
                      <label htmlFor={`ex-type-${exercise.id}`} className={smallLabelClass}>Type</label>
                      <select
                        value={exercise.type}
                        onChange={(e) => updateExercise(exercise.id, 'type', e.target.value as Exercise['type'])}
                        id={`ex-type-${exercise.id}`}
                        className="field field-sm"
                      >
                        <option value="weight_lifting">Weight Lifting</option>
                        <option value="cardio">Cardio</option>
                        <option value="hiit">HIIT</option>
                        <option value="yoga">Yoga</option>
                        <option value="sports">Sports</option>
                      </select>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                      <label htmlFor={`ex-intensity-${exercise.id}`} className={smallLabelClass}>Intensity</label>
                      <select
                        value={exercise.intensity}
                        onChange={(e) => updateExercise(exercise.id, 'intensity', e.target.value as Exercise['intensity'])}
                        id={`ex-intensity-${exercise.id}`}
                        aria-describedby={`ex-intensity-desc-${exercise.id}`}
                        className="field field-sm"
                      >
                        {intensityDescriptions[exercise.type].map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <p id={`ex-intensity-desc-${exercise.id}`} className={hintClass}>
                        {intensityDescriptions[exercise.type].find(opt => opt.value === exercise.intensity)?.description}
                      </p>
                    </div>

                    <div>
                      <label htmlFor={`ex-min-${exercise.id}`} className={smallLabelClass}>Minutes/Session</label>
                      <input
                        type="number"
                        value={exercise.minutes === 0 ? '' : exercise.minutes}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === '' ? 0 : parseInt(value);
                          if (!isNaN(numValue) && numValue >= 0) {
                            updateExercise(exercise.id, 'minutes', numValue);
                          }
                        }}
                        id={`ex-min-${exercise.id}`}
                        inputMode="numeric"
                        aria-invalid={minutesInvalid}
                        aria-describedby={minutesInvalid ? `ex-min-err-${exercise.id}` : undefined}
                        className="field field-sm"
                        min="5"
                        max="300"
                        placeholder="60"
                      />
                      {minutesInvalid && (
                        <p id={`ex-min-err-${exercise.id}`} className={errorClass}>Minutes must be 5–300.</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`ex-freq-${exercise.id}`} className={smallLabelClass}>Days/Week</label>
                      <input
                        type="number"
                        value={exercise.frequency === 0 ? '' : exercise.frequency}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === '' ? 0 : parseInt(value);
                          if (!isNaN(numValue) && numValue >= 0) {
                            updateExercise(exercise.id, 'frequency', numValue);
                          }
                        }}
                        id={`ex-freq-${exercise.id}`}
                        inputMode="numeric"
                        aria-invalid={daysInvalid}
                        aria-describedby={daysInvalid ? `ex-freq-err-${exercise.id}` : undefined}
                        className="field field-sm"
                        min="1"
                        max="7"
                        placeholder="3"
                      />
                      {daysInvalid && (
                        <p id={`ex-freq-err-${exercise.id}`} className={errorClass}>Days must be 1–7.</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Exercise Button */}
            <button
              type="button"
              onClick={addExercise}
              className="w-full min-h-12 px-4 border border-dashed border-border-strong rounded-[3px] text-foreground hover:border-accent-ink hover:text-accent-ink transition-colors flex items-center justify-center gap-2 label-caps cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Exercise Type
            </button>
          </div>
        )}
      </section>

      {/* Phase 4: Optimization (Optional but Important) */}
      <section className="space-y-6 border border-dashed border-border-strong rounded-[3px] p-4 sm:p-5">
        <SectionHeading index="Phase 04" title="Optimization" hint="Optional settings for enhanced accuracy" />

        {/* Body Fat Percentage */}
        <div>
          <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1 mb-2">
            <label htmlFor="body-fat" className="block">
              <span className="label-caps text-foreground">Body Fat %</span>{' '}
              <span className="text-xs text-muted-foreground">(optional - improves accuracy)</span>
            </label>
            <button
              type="button"
              onClick={() => setShowBodyFatGuide(!showBodyFatGuide)}
              aria-expanded={showBodyFatGuide}
              className="inline-flex items-center gap-2 min-h-11 -my-2 px-2 -mr-2 label-caps text-accent-ink hover:underline underline-offset-4 cursor-pointer"
            >
              {showBodyFatGuide ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showBodyFatGuide ? 'Hide' : 'Show'} Visual Guide
            </button>
          </div>

          <div className="flex">
            <input
              type="number"
              value={userData.bodyFat || ''}
              onChange={(e) => handleInputChange('bodyFat', e.target.value ? parseFloat(e.target.value) : undefined)}
              id="body-fat"
              inputMode="numeric"
              aria-invalid={bodyFatOutOfRange}
              aria-describedby={bodyFatOutOfRange ? 'body-fat-error' : undefined}
              className={groupedFieldClass}
              min="5"
              max="50"
              step="0.1"
              placeholder="e.g., 15"
            />
            <UnitCell>%</UnitCell>
          </div>
          {bodyFatOutOfRange && (
            <p id="body-fat-error" className={errorClass}>Body fat must be 5–50% if provided.</p>
          )}

          <div className="mt-3 border-l-2 border-accent-ink bg-muted/70 px-3 py-2.5">
            <p className="text-sm text-foreground">
              <strong className="font-semibold">Accuracy boost:</strong> Adding a body fat estimate enables the Katch–McArdle (lean mass) formula, which can improve precision for muscular or lean users.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Only add if you have a close estimate from DEXA, BodPod, or calipers. If unsure, leave blank.
            </p>
          </div>

          {/* Visual Body Fat Guide */}
          {showBodyFatGuide && (
            <div className="mt-4 p-3 sm:p-4 bg-card border border-border rounded-[3px] lab-enter">
              <h4 className="label-caps text-foreground mb-3 text-center">
                Body Fat Percentage Visual Guide - {userData.gender === 'male' ? 'Male' : 'Female'}
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {bodyFatGuide[userData.gender].map((item, index) => (
                  <div key={index} className="text-center">
                    <button
                      type="button"
                      className="group relative block w-full mb-2 cursor-pointer rounded-[2px] overflow-hidden border border-border"
                      onClick={() => setSelectedBodyFatImage(item)}
                      aria-label={`Enlarge ${item.range} body fat reference`}
                    >
                      <img
                        src={item.image}
                        alt={`${userData.gender} ${item.range} body fat`}
                        className="w-full h-32 object-cover group-hover:opacity-85 transition-opacity"
                      />
                      <span className="absolute top-1.5 left-1.5 bg-background/90 text-foreground font-mono text-xs px-1.5 py-0.5 rounded-[2px] pointer-events-none">
                        {item.range}
                      </span>
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="bg-background/90 text-foreground p-1.5 rounded-[2px]">
                          <Eye className="w-5 h-5" />
                        </span>
                      </span>
                    </button>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-4 p-3 bg-muted text-xs text-muted-foreground text-center rounded-[2px]">
                <strong>Note:</strong> These are visual approximations. For accuracy, use professional measurement methods (DEXA, BodPod, calipers).
              </p>
            </div>
          )}
        </div>

        {/* Error Margin Preference */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <label htmlFor="error-margin" className="label-caps text-foreground">
              Error Margin Preference
            </label>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowErrorMarginInfo(true)}
                onMouseLeave={() => setShowErrorMarginInfo(false)}
                onFocus={() => setShowErrorMarginInfo(true)}
                onBlur={() => setShowErrorMarginInfo(false)}
                aria-label="What is error margin?"
                aria-describedby={showErrorMarginInfo ? 'error-margin-info' : undefined}
                className="inline-flex items-center justify-center w-11 h-11 -my-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
              {showErrorMarginInfo && (
                <div
                  id="error-margin-info"
                  role="tooltip"
                  className="absolute bottom-full right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mb-1 w-64 max-w-[calc(100vw-2rem)] p-3 bg-foreground text-background text-xs rounded-[3px] shadow-lg z-10"
                >
                  <p className="label-caps mb-1">What is Error Margin?</p>
                  <p className="leading-relaxed">TDEE calculations are estimates. Error margin shows the range your actual TDEE might fall within. Lower = tighter range but may miss individual variations. Higher = wider safety buffer.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Conservative (safer)</span>
              <span className="text-xs text-muted-foreground">Precise (tighter)</span>
            </div>

            <div>
              <input
                type="range"
                min="3"
                max="12"
                step="1"
                value={marginPct}
                onChange={(e) => handleInputChange('errorMarginPreference', parseInt(e.target.value))}
                id="error-margin"
                aria-valuetext={`plus or minus ${marginPct} percent`}
                className="range block"
                style={{ '--range-pct': `${(marginPct - 3) * 11.11}%` } as CSSProperties}
              />
              {/* One tick per step, inset by half the thumb so each sits under a stop. */}
              <div aria-hidden="true" className="flex justify-between px-[9px] -mt-2.5 h-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <span
                    key={i}
                    className={`w-px ${i === 0 || i === 4 || i === 9 ? 'h-2 bg-foreground/60' : 'h-1 bg-border-strong'}`}
                  />
                ))}
              </div>
              <div aria-hidden="true" className="relative h-4 mt-1 mx-[9px] font-mono text-xs text-muted-foreground">
                <span className="absolute left-0 -translate-x-1/2">3%</span>
                <span className="absolute left-[44.44%] -translate-x-1/2">7%</span>
                <span className="absolute right-0 translate-x-1/2">12%</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-3">
              <span className="readout inline-flex items-center px-2 py-1 rounded-[2px] text-sm font-medium bg-foreground text-background">
                ±{userData.errorMarginPreference || 7}% Error Margin
              </span>
              <p className="text-xs text-muted-foreground">
                {userData.errorMarginPreference === 3 && "Very tight range - for precise trackers"}
                {userData.errorMarginPreference === 7 && "Recommended - good balance of accuracy and safety"}
                {userData.errorMarginPreference === 12 && "Wide range - safer buffer for casual tracking"}
                {(userData.errorMarginPreference && ![3, 7, 12].includes(userData.errorMarginPreference)) && "Custom range selected"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <button
        type="submit"
        className="group w-full min-h-14 px-6 bg-accent text-accent-foreground border border-accent-ink rounded-[3px] flex items-center justify-center gap-3 label-caps text-sm hover:brightness-105 active:translate-y-px transition cursor-pointer"
      >
        <Reticle className="w-5 h-5" />
        Calculate My TDEE
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
      </button>

      {/* Body Fat Image Modal */}
      {selectedBodyFatImage && (
        <div
          className="fixed inset-0 bg-background/85 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4"
          onClick={() => setSelectedBodyFatImage(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="body-fat-modal-title"
            className="panel brackets max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl lab-enter"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedBodyFatImage(null)}
              aria-label="Close"
              className="absolute top-2 right-2 inline-flex items-center justify-center w-11 h-11 bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border rounded-[2px] z-10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Large Image */}
            <div className="p-5 sm:p-8">
              <div className="mb-5 pr-12">
                <h3 id="body-fat-modal-title" className="readout text-3xl font-semibold text-foreground mb-1">
                  {selectedBodyFatImage.range} Body Fat
                </h3>
                <p className="label-caps text-muted-foreground">
                  {userData.gender === 'male' ? 'Male' : 'Female'} Reference
                </p>
              </div>

              <div className="bg-muted border border-border rounded-[2px] p-3 sm:p-4 mb-5">
                <img
                  src={selectedBodyFatImage.image}
                  alt={`${userData.gender} ${selectedBodyFatImage.range} body fat`}
                  className="w-full h-72 sm:h-96 object-contain"
                />
              </div>

              {/* Image Info */}
              <div className="space-y-4">
                <p className="text-foreground text-base sm:text-lg leading-relaxed">
                  {selectedBodyFatImage.description}
                </p>
                <div className="border-l-2 border-accent-ink bg-muted/70 px-3 py-2.5">
                  <p className="text-sm text-foreground">
                    <strong className="label-caps mr-2">Tip</strong>
                    If this looks similar to your physique, you can use this range as an estimate for more accurate TDEE calculations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

const labelClass = 'label-caps block text-foreground mb-2';
// Tighter tracking so 'Minutes/Session' fits a half-width cell at 360px.
const smallLabelClass = 'label-caps tracking-[0.08em] block text-muted-foreground mb-1.5';
const hintClass = 'mt-1.5 text-xs text-muted-foreground';
const errorClass = 'mt-1.5 text-xs text-danger';
// Inputs that sit beside a unit cell lose their right-hand corners; focus
// lifts them above the cell so the ring is not clipped.
const groupedFieldClass = 'field relative focus:z-10 rounded-r-none min-w-0';

function UnitCell({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center shrink-0 px-3 border border-l-0 border-input bg-muted label-caps text-muted-foreground rounded-r-[2px]"
    >
      {children}
    </span>
  );
}
