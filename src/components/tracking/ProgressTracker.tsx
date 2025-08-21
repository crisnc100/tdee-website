'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserData } from '@/types/calculator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  TrendingUp, TrendingDown, Scale, Activity, Target, Calendar, Camera, 
  Plus, ChevronRight, Trophy, Zap, Ruler, Percent, Award, CheckCircle,
  AlertCircle, Info, X, Edit2, Trash2, Download, Share2, Eye, Upload,
  ChevronLeft, Image
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProgressEntry {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  measurements?: {
    waist?: number;
    chest?: number;
    arms?: number;
    thighs?: number;
    neck?: number;
    hips?: number;
  };
  calories?: number;
  notes?: string;
  photoUrl?: string;
  photos?: {
    front?: string;
    side?: string;
    back?: string;
  };
  mood?: 'great' | 'good' | 'okay' | 'tired' | 'stressed';
  adherence?: number; // 0-100%
}

interface Goal {
  type: 'weight' | 'bodyFat' | 'measurement';
  target: number;
  deadline?: string;
  metric?: string; // e.g., 'waist', 'arms'
}

interface ProgressTrackerProps {
  userData: UserData;
  currentTDEE: number;
}

export default function ProgressTracker({ userData, currentTDEE }: ProgressTrackerProps) {
  const [entries, setEntries] = useLocalStorage<ProgressEntry[]>('progress-entries', []);
  const [goals, setGoals] = useLocalStorage<Goal[]>('progress-goals', []);
  const [activeView, setActiveView] = useState<'dashboard' | 'add' | 'history' | 'goals' | 'photos'>('dashboard');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'bodyFat' | 'measurements'>('weight');
  const [showPhotoComparison, setShowPhotoComparison] = useState(false);
  const [comparisonPhotos, setComparisonPhotos] = useState<{before?: ProgressEntry, after?: ProgressEntry}>({});
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // Goal form states
  const [newGoalType, setNewGoalType] = useState<'weight' | 'bodyFat' | 'measurement'>('weight');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalMetric, setNewGoalMetric] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  
  // Form states
  const [newEntry, setNewEntry] = useState<Partial<ProgressEntry>>({
    date: new Date().toISOString().split('T')[0],
    weight: userData.weight || undefined,
    adherence: 80
  });

  // Calculate progress statistics
  const getProgressStats = () => {
    if (entries.length < 2) return null;
    
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    const lastWeek = sortedEntries.filter(e => {
      const entryDate = new Date(e.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    });

    return {
      totalWeightChange: lastEntry.weight && firstEntry.weight 
        ? lastEntry.weight - firstEntry.weight 
        : 0,
      weeklyAverage: lastWeek.length > 0 
        ? lastWeek.reduce((sum, e) => sum + (e.weight || 0), 0) / lastWeek.length 
        : 0,
      bodyFatChange: lastEntry.bodyFat && firstEntry.bodyFat
        ? lastEntry.bodyFat - firstEntry.bodyFat
        : 0,
      daysTracked: entries.length,
      averageAdherence: entries.reduce((sum, e) => sum + (e.adherence || 0), 0) / entries.length,
      currentStreak: calculateStreak()
    };
  };

  const calculateStreak = () => {
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].date);
      entryDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (Math.abs(entryDate.getTime() - expectedDate.getTime()) < 86400000) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getGoalProgress = (goal: Goal) => {
    const relevantEntries = entries.filter(e => {
      if (goal.type === 'weight' && e.weight) return true;
      if (goal.type === 'bodyFat' && e.bodyFat) return true;
      if (goal.type === 'measurement' && goal.metric && e.measurements) {
        const measurements = e.measurements as any;
        return measurements[goal.metric] !== undefined;
      }
      return false;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (relevantEntries.length === 0) return 0;

    let currentValue: number | undefined;
    if (goal.type === 'weight') {
      currentValue = relevantEntries[0].weight;
    } else if (goal.type === 'bodyFat') {
      currentValue = relevantEntries[0].bodyFat;
    } else if (goal.metric && relevantEntries[0].measurements) {
      const measurements = relevantEntries[0].measurements as any;
      currentValue = measurements[goal.metric];
    }

    const firstEntry = relevantEntries[relevantEntries.length - 1];
    let startValue: number | undefined;
    if (goal.type === 'weight') {
      startValue = firstEntry.weight;
    } else if (goal.type === 'bodyFat') {
      startValue = firstEntry.bodyFat;
    } else if (goal.metric && firstEntry.measurements) {
      const measurements = firstEntry.measurements as any;
      startValue = measurements[goal.metric];
    }

    if (!currentValue || !startValue) return 0;

    const totalChange = Math.abs(goal.target - startValue);
    const currentChange = Math.abs(currentValue - startValue);
    
    return Math.min(100, (currentChange / totalChange) * 100);
  };

  const addNewEntry = () => {
    const entry: ProgressEntry = {
      ...newEntry,
      id: Date.now().toString(),
      date: newEntry.date || new Date().toISOString().split('T')[0]
    };

    setEntries([...entries, entry]);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      weight: userData.weight || undefined,
      adherence: 80
    });
    setShowAddForm(false);
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  // Photo handling functions
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>, angle: 'front' | 'side' | 'back') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEntry({
          ...newEntry,
          photos: {
            ...newEntry.photos,
            [angle]: reader.result as string
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const getEntriesWithPhotos = () => {
    return entries.filter(e => e.photos && (e.photos.front || e.photos.side || e.photos.back));
  };

  const selectComparisonPhoto = (entry: ProgressEntry, type: 'before' | 'after') => {
    setComparisonPhotos({
      ...comparisonPhotos,
      [type]: entry
    });
  };

  const stats = getProgressStats();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progress Tracker</h2>
          <p className="text-sm text-gray-600 mt-1">Track your journey to your goals</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'history', label: 'History', icon: Calendar },
          { id: 'photos', label: 'Photos', icon: Camera },
          { id: 'goals', label: 'Goals', icon: Target }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all ${
              activeView === id
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Dashboard View */}
      {activeView === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <span className={`text-sm font-medium ${
                    stats.totalWeightChange < 0 ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {stats.totalWeightChange > 0 ? '+' : ''}{stats.totalWeightChange.toFixed(1)} {userData.units === 'imperial' ? 'lbs' : 'kg'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Total Weight Change</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <Trophy className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-bold text-green-700">{stats.currentStreak}</span>
                </div>
                <p className="text-xs text-gray-600">Day Streak</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <Percent className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-bold text-amber-700">{stats.averageAdherence.toFixed(0)}%</span>
                </div>
                <p className="text-xs text-gray-600">Avg Adherence</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-bold text-purple-700">{stats.daysTracked}</span>
                </div>
                <p className="text-xs text-gray-600">Days Tracked</p>
              </motion.div>
            </div>
          )}

          {/* Chart Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Progress Chart</h3>
              <div className="flex gap-2">
                {['weight', 'bodyFat', 'measurements'].map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric as any)}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${
                      selectedMetric === metric
                        ? 'bg-amber-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {metric === 'bodyFat' ? 'Body Fat' : metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {entries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={entries.filter(e => {
                  if (selectedMetric === 'weight') return e.weight;
                  if (selectedMetric === 'bodyFat') return e.bodyFat;
                  if (selectedMetric === 'measurements') return e.measurements?.waist;
                  return false;
                }).map(e => ({
                  date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: selectedMetric === 'weight' ? e.weight :
                         selectedMetric === 'bodyFat' ? e.bodyFat :
                         e.measurements?.waist
                }))}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No data yet. Add your first entry!</p>
                </div>
              </div>
            )}
          </div>

          {/* Goals Progress */}
          {goals.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Goal Progress</h3>
              {goals.map((goal, index) => {
                const progress = getGoalProgress(goal);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-gray-900">
                          {goal.type === 'weight' ? 'Weight Goal' :
                           goal.type === 'bodyFat' ? 'Body Fat Goal' :
                           `${goal.metric} Goal`}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        Target: {goal.target}{goal.type === 'bodyFat' ? '%' : userData.units === 'imperial' ? ' lbs' : ' kg'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{progress.toFixed(0)}% Complete</p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* History View */}
      {activeView === 'history' && (
        <div className="space-y-3">
          {entries.length > 0 ? (
            [...entries].reverse().map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="font-medium text-gray-900">
                      {new Date(entry.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    {entry.mood && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        entry.mood === 'great' ? 'bg-green-100 text-green-700' :
                        entry.mood === 'good' ? 'bg-blue-100 text-blue-700' :
                        entry.mood === 'okay' ? 'bg-gray-100 text-gray-700' :
                        entry.mood === 'tired' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {entry.mood}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {entry.weight && (
                      <div>
                        <span className="text-gray-500">Weight:</span>
                        <span className="ml-1 font-medium">{entry.weight} {userData.units === 'imperial' ? 'lbs' : 'kg'}</span>
                      </div>
                    )}
                    {entry.bodyFat && (
                      <div>
                        <span className="text-gray-500">Body Fat:</span>
                        <span className="ml-1 font-medium">{entry.bodyFat}%</span>
                      </div>
                    )}
                    {entry.adherence !== undefined && (
                      <div>
                        <span className="text-gray-500">Adherence:</span>
                        <span className="ml-1 font-medium">{entry.adherence}%</span>
                      </div>
                    )}
                    {entry.calories && (
                      <div>
                        <span className="text-gray-500">Calories:</span>
                        <span className="ml-1 font-medium">{entry.calories}</span>
                      </div>
                    )}
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">"{entry.notes}"</p>
                  )}
                </div>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No entries yet</p>
            </div>
          )}
        </div>
      )}

      {/* Photos View */}
      {activeView === 'photos' && (
        <div className="space-y-6">
          {/* Photo Comparison Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Progress Photos</h3>
              <p className="text-sm text-gray-600 mt-1">Your visual transformation journey</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPhotoComparison(!showPhotoComparison)}
                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showPhotoComparison ? 'Hide Comparison' : 'Compare Photos'}
              </button>
              {comparisonPhotos.before || comparisonPhotos.after ? (
                <button
                  onClick={() => setComparisonPhotos({})}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Clear Selection
                </button>
              ) : null}
            </div>
          </div>

          {/* Photo Comparison */}
          {showPhotoComparison && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 rounded-lg p-6"
            >
              <h4 className="font-medium text-gray-900 mb-4">Side-by-Side Comparison</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Before Photo */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Before</h5>
                  {comparisonPhotos.before ? (
                    <div className="space-y-2">
                      <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                        {comparisonPhotos.before.photos?.front ? (
                          <img 
                            src={comparisonPhotos.before.photos.front} 
                            alt="Before" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <Camera className="w-12 h-12" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Date: {new Date(comparisonPhotos.before.date).toLocaleDateString()}</p>
                        {comparisonPhotos.before.weight && (
                          <p>Weight: {comparisonPhotos.before.weight} {userData.units === 'imperial' ? 'lbs' : 'kg'}</p>
                        )}
                        {comparisonPhotos.before.bodyFat && (
                          <p>Body Fat: {comparisonPhotos.before.bodyFat}%</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400">
                      <Camera className="w-12 h-12 mb-2" />
                      <p className="text-sm">Select a photo below</p>
                    </div>
                  )}
                </div>

                {/* After Photo */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">After</h5>
                  {comparisonPhotos.after ? (
                    <div className="space-y-2">
                      <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                        {comparisonPhotos.after.photos?.front ? (
                          <img 
                            src={comparisonPhotos.after.photos.front} 
                            alt="After" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <Camera className="w-12 h-12" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Date: {new Date(comparisonPhotos.after.date).toLocaleDateString()}</p>
                        {comparisonPhotos.after.weight && (
                          <p>Weight: {comparisonPhotos.after.weight} {userData.units === 'imperial' ? 'lbs' : 'kg'}</p>
                        )}
                        {comparisonPhotos.after.bodyFat && (
                          <p>Body Fat: {comparisonPhotos.after.bodyFat}%</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400">
                      <Camera className="w-12 h-12 mb-2" />
                      <p className="text-sm">Select a photo below</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Stats */}
              {comparisonPhotos.before && comparisonPhotos.after && (
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Progress Summary</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {comparisonPhotos.before.weight && comparisonPhotos.after.weight && (
                      <div>
                        <span className="text-gray-500">Weight Change:</span>
                        <span className={`ml-1 font-medium ${
                          comparisonPhotos.after.weight < comparisonPhotos.before.weight 
                            ? 'text-green-600' 
                            : 'text-amber-600'
                        }`}>
                          {(comparisonPhotos.after.weight - comparisonPhotos.before.weight).toFixed(1)} {userData.units === 'imperial' ? 'lbs' : 'kg'}
                        </span>
                      </div>
                    )}
                    {comparisonPhotos.before.bodyFat && comparisonPhotos.after.bodyFat && (
                      <div>
                        <span className="text-gray-500">Body Fat Change:</span>
                        <span className={`ml-1 font-medium ${
                          comparisonPhotos.after.bodyFat < comparisonPhotos.before.bodyFat 
                            ? 'text-green-600' 
                            : 'text-amber-600'
                        }`}>
                          {(comparisonPhotos.after.bodyFat - comparisonPhotos.before.bodyFat).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <span className="ml-1 font-medium">
                        {Math.floor((new Date(comparisonPhotos.after.date).getTime() - new Date(comparisonPhotos.before.date).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Photo Gallery */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Photo Timeline</h4>
              {getEntriesWithPhotos().length > 0 && (
                <p className="text-sm text-gray-500">
                  {showPhotoComparison ? 'Click photos to select for comparison' : `${getEntriesWithPhotos().length} photos`}
                </p>
              )}
            </div>
            {getEntriesWithPhotos().length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {getEntriesWithPhotos().reverse().map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group"
                  >
                    <div 
                      className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => {
                        if (showPhotoComparison) {
                          if (!comparisonPhotos.before || comparisonPhotos.before.id === entry.id) {
                            selectComparisonPhoto(entry, 'before');
                          } else if (!comparisonPhotos.after || comparisonPhotos.after.id === entry.id) {
                            selectComparisonPhoto(entry, 'after');
                          }
                        }
                      }}
                    >
                      {entry.photos?.front ? (
                        <img 
                          src={entry.photos.front} 
                          alt={`Progress ${entry.date}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : entry.photos?.side ? (
                        <img 
                          src={entry.photos.side} 
                          alt={`Progress ${entry.date}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <img 
                          src={entry.photos?.back} 
                          alt={`Progress ${entry.date}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                    
                    {/* Overlay with date and stats */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white rounded-b-lg">
                      <p className="text-xs font-medium">
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {entry.weight && (
                        <p className="text-xs opacity-90">{entry.weight} {userData.units === 'imperial' ? 'lbs' : 'kg'}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this photo entry?')) {
                            deleteEntry(entry.id);
                          }
                        }}
                        className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Selection indicators */}
                    {comparisonPhotos.before?.id === entry.id && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg font-medium">
                        Before
                      </div>
                    )}
                    {comparisonPhotos.after?.id === entry.id && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-lg font-medium">
                        After
                      </div>
                    )}

                    {/* Clickable indicator when in comparison mode */}
                    {showPhotoComparison && !comparisonPhotos.before?.id && !comparisonPhotos.after?.id && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/90 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700">
                            Select as Before
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 mb-2">No progress photos yet</p>
                <p className="text-sm text-gray-500">Add photos when creating new entries to track visual progress</p>
              </div>
            )}
          </div>

          {/* Photo Tips */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Photo Tips for Best Results
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Take photos at the same time of day (preferably morning)</li>
              <li>• Use consistent lighting and background</li>
              <li>• Wear similar clothing or swimwear</li>
              <li>• Maintain the same pose and distance from camera</li>
              <li>• Take front, side, and back angles for complete tracking</li>
            </ul>
          </div>
        </div>
      )}

      {/* Goals View */}
      {activeView === 'goals' && (
        <div className="space-y-6">
          {/* Header with motivation */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your Personal Goals</h3>
                <p className="text-gray-600 text-sm">
                  {goals.length === 0 
                    ? "Let's set some goals together! Small steps lead to big changes." 
                    : `You're working on ${goals.length} goal${goals.length > 1 ? 's' : ''}. Keep going, you've got this! 💪`
                  }
                </p>
              </div>
              <button
                onClick={() => setShowAddGoalForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Set New Goal
              </button>
            </div>
            
            {/* Motivational quote */}
            <div className="mt-4 p-3 bg-white/60 rounded-lg">
              <p className="text-sm italic text-gray-700">
                "A goal properly set is halfway reached." - Zig Ziglar
              </p>
            </div>
          </div>
          
          {/* Goal Cards */}
          {goals.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Your Active Goals</h4>
              {goals.map((goal, index) => {
                const progress = getGoalProgress(goal);
                const isCloseToGoal = progress >= 80;
                const latestEntry = entries.filter(e => {
                  if (goal.type === 'weight') return e.weight;
                  if (goal.type === 'bodyFat') return e.bodyFat;
                  return e.measurements?.[goal.metric as keyof typeof e.measurements];
                }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-xl p-5 border ${
                      isCloseToGoal 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {goal.type === 'weight' ? (
                            <Scale className="w-5 h-5 text-amber-600" />
                          ) : goal.type === 'bodyFat' ? (
                            <Percent className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Ruler className="w-5 h-5 text-purple-600" />
                          )}
                          <h5 className="font-semibold text-gray-900">
                            {goal.type === 'weight' ? 'Weight Goal' :
                             goal.type === 'bodyFat' ? 'Body Fat Goal' :
                             `${goal.metric?.charAt(0).toUpperCase()}${goal.metric?.slice(1)} Measurement`}
                          </h5>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-2xl font-bold text-gray-900">
                            {goal.target}
                          </span>
                          <span className="text-sm text-gray-500">
                            {goal.type === 'bodyFat' ? '%' : userData.units === 'imperial' ? 
                              (goal.type === 'weight' ? 'lbs' : 'inches') : 
                              (goal.type === 'weight' ? 'kg' : 'cm')}
                          </span>
                        </div>
                        {latestEntry && (
                          <p className="text-sm text-gray-600 mt-1">
                            Current: {goal.type === 'weight' ? latestEntry.weight :
                                     goal.type === 'bodyFat' ? latestEntry.bodyFat :
                                     latestEntry.measurements?.[goal.metric as keyof typeof latestEntry.measurements]}
                            {goal.type === 'bodyFat' ? '%' : ''}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setGoals(goals.filter((_, i) => i !== index))}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className={`font-medium ${
                          progress >= 100 ? 'text-green-600' :
                          progress >= 80 ? 'text-amber-600' :
                          progress >= 50 ? 'text-blue-600' :
                          'text-gray-600'
                        }`}>
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <motion.div
                          className={`h-3 rounded-full ${
                            progress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            progress >= 80 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                            'bg-gradient-to-r from-blue-500 to-indigo-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, progress)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                    
                    {/* Motivational Message */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        {progress >= 100 ? '🎉 Congratulations! You\'ve reached your goal!' :
                         progress >= 80 ? '🔥 Amazing! You\'re so close to your goal!' :
                         progress >= 50 ? '💪 Great progress! Keep pushing forward!' :
                         progress >= 25 ? '👍 Good start! Stay consistent!' :
                         '🌟 Every journey starts with a single step. You\'ve got this!'}
                      </p>
                    </div>
                    
                    {goal.deadline && (
                      <div className="mt-2 text-xs text-gray-500">
                        Target date: {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Empty state with suggestions */}
              <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                <Target className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                <h4 className="font-semibold text-gray-900 mb-2">Ready to Set Your First Goal?</h4>
                <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
                  Goals give you direction and motivation. Start with something achievable and build from there!
                </p>
              </div>
              
              {/* Suggested Goals */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Suggested Goals Based on Your Profile</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userData.goal === 'lose' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const currentWeight = userData.weight || 70;
                          const targetWeight = userData.units === 'imperial' 
                            ? currentWeight - 10 
                            : currentWeight - 5;
                          setGoals([...goals, { type: 'weight', target: targetWeight }]);
                        }}
                        className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200 text-left hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Lose {userData.units === 'imperial' ? '10 lbs' : '5 kg'}</p>
                            <p className="text-xs text-gray-600">A healthy, achievable weight loss goal</p>
                          </div>
                        </div>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setGoals([...goals, { type: 'bodyFat', target: 18 }])}
                        className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 text-left hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Percent className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Reach 18% Body Fat</p>
                            <p className="text-xs text-gray-600">Lean and healthy body composition</p>
                          </div>
                        </div>
                      </motion.button>
                    </>
                  )}
                  
                  {userData.goal === 'gain' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const currentWeight = userData.weight || 70;
                          const targetWeight = userData.units === 'imperial' 
                            ? currentWeight + 10 
                            : currentWeight + 5;
                          setGoals([...goals, { type: 'weight', target: targetWeight }]);
                        }}
                        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 text-left hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Gain {userData.units === 'imperial' ? '10 lbs' : '5 kg'}</p>
                            <p className="text-xs text-gray-600">Build muscle and strength</p>
                          </div>
                        </div>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setGoals([...goals, { type: 'measurement', target: userData.units === 'imperial' ? 16 : 40, metric: 'arms' }])}
                        className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 text-left hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Ruler className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Build {userData.units === 'imperial' ? '16"' : '40cm'} Arms</p>
                            <p className="text-xs text-gray-600">Increase muscle measurements</p>
                          </div>
                        </div>
                      </motion.button>
                    </>
                  )}
                  
                  {/* Universal goals */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setGoals([...goals, { type: 'measurement', target: userData.units === 'imperial' ? 32 : 80, metric: 'waist' }])}
                    className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 text-left hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Ruler className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{userData.units === 'imperial' ? '32"' : '80cm'} Waist</p>
                        <p className="text-xs text-gray-600">Improve core measurements</p>
                      </div>
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddGoalForm(true)}
                    className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-300 text-left hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-200 rounded-lg">
                        <Plus className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Custom Goal</p>
                        <p className="text-xs text-gray-600">Set your own target</p>
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddGoalForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddGoalForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Set Your Goal</h3>
                <button
                  onClick={() => setShowAddGoalForm(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Goal Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">What do you want to track?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'weight', label: 'Weight', icon: Scale },
                      { value: 'bodyFat', label: 'Body Fat', icon: Percent },
                      { value: 'measurement', label: 'Measurement', icon: Ruler }
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setNewGoalType(value as any)}
                        className={`p-3 rounded-lg border transition-all ${
                          newGoalType === value
                            ? 'bg-amber-50 border-amber-500 text-amber-700'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-xs font-medium">{label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Measurement Type (if measurement selected) */}
                {newGoalType === 'measurement' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Which measurement?</label>
                    <select
                      value={newGoalMetric}
                      onChange={(e) => setNewGoalMetric(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="">Select measurement</option>
                      <option value="waist">Waist</option>
                      <option value="chest">Chest</option>
                      <option value="arms">Arms</option>
                      <option value="thighs">Thighs</option>
                      <option value="neck">Neck</option>
                      <option value="hips">Hips</option>
                    </select>
                  </div>
                )}

                {/* Target Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target {newGoalType === 'weight' ? `(${userData.units === 'imperial' ? 'lbs' : 'kg'})` :
                            newGoalType === 'bodyFat' ? '(%)' :
                            `(${userData.units === 'imperial' ? 'inches' : 'cm'})`}
                  </label>
                  <input
                    type="number"
                    step={newGoalType === 'bodyFat' ? '0.1' : '1'}
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder={
                      newGoalType === 'weight' ? (userData.units === 'imperial' ? '150' : '70') :
                      newGoalType === 'bodyFat' ? '15' :
                      userData.units === 'imperial' ? '32' : '80'
                    }
                  />
                </div>

                {/* Optional Deadline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newGoalDeadline}
                    onChange={(e) => setNewGoalDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                {/* Helpful Tips */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> Set realistic goals! 
                    {newGoalType === 'weight' && ' Aim for 1-2 lbs per week for sustainable progress.'}
                    {newGoalType === 'bodyFat' && ' A 1% change per month is excellent progress.'}
                    {newGoalType === 'measurement' && ' Measurements change slowly but consistently with training.'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAddGoalForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newGoalTarget && (newGoalType !== 'measurement' || newGoalMetric)) {
                        setGoals([...goals, {
                          type: newGoalType,
                          target: parseFloat(newGoalTarget),
                          metric: newGoalMetric || undefined,
                          deadline: newGoalDeadline || undefined
                        }]);
                        setShowAddGoalForm(false);
                        setNewGoalType('weight');
                        setNewGoalTarget('');
                        setNewGoalMetric('');
                        setNewGoalDeadline('');
                      }
                    }}
                    disabled={!newGoalTarget || (newGoalType === 'measurement' && !newGoalMetric)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set Goal
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Add Progress Entry</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight ({userData.units === 'imperial' ? 'lbs' : 'kg'})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEntry.weight || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, weight: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder={userData.weight?.toString()}
                  />
                </div>

                {/* Body Fat */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEntry.bodyFat || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, bodyFat: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>

                {/* Measurements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Measurements ({userData.units === 'imperial' ? 'inches' : 'cm'})
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Waist"
                      onChange={(e) => setNewEntry({
                        ...newEntry,
                        measurements: { ...newEntry.measurements, waist: parseFloat(e.target.value) }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Chest"
                      onChange={(e) => setNewEntry({
                        ...newEntry,
                        measurements: { ...newEntry.measurements, chest: parseFloat(e.target.value) }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Arms"
                      onChange={(e) => setNewEntry({
                        ...newEntry,
                        measurements: { ...newEntry.measurements, arms: parseFloat(e.target.value) }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Thighs"
                      onChange={(e) => setNewEntry({
                        ...newEntry,
                        measurements: { ...newEntry.measurements, thighs: parseFloat(e.target.value) }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Adherence */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diet Adherence: {newEntry.adherence}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newEntry.adherence || 80}
                    onChange={(e) => setNewEntry({ ...newEntry, adherence: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Mood */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling?</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['great', 'good', 'okay', 'tired', 'stressed'].map((mood) => (
                      <button
                        key={mood}
                        onClick={() => setNewEntry({ ...newEntry, mood: mood as any })}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          newEntry.mood === mood
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress Photos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Progress Photos</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['front', 'side', 'back'].map((angle) => (
                      <div key={angle} className="text-center">
                        <div 
                          className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-2 cursor-pointer hover:bg-gray-200 transition-colors relative group"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => handlePhotoUpload(e as any, angle as any);
                            input.click();
                          }}
                        >
                          {newEntry.photos?.[angle as keyof typeof newEntry.photos] ? (
                            <>
                              <img 
                                src={newEntry.photos[angle as keyof typeof newEntry.photos]} 
                                alt={angle}
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewEntry({
                                    ...newEntry,
                                    photos: {
                                      ...newEntry.photos,
                                      [angle]: undefined
                                    }
                                  });
                                }}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                              <Upload className="w-6 h-6 mb-1" />
                              <span className="text-xs">Upload</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 capitalize">{angle}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Optional: Add photos to track visual progress</p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newEntry.notes || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    rows={3}
                    placeholder="Any observations or thoughts..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addNewEntry}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}