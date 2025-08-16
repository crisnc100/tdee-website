'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrackingData } from '@/types/calculator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TrendingUp, TrendingDown, Plus, Calendar, Target, Scale } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeightTrackerProps {
  currentTDEE: number;
}

export default function WeightTracker({ currentTDEE }: WeightTrackerProps) {
  const [trackingData, setTrackingData] = useLocalStorage<TrackingData[]>('weight-tracking', []);
  const [newWeight, setNewWeight] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [showAddForm, setShowAddForm] = useState(false);

  const addEntry = () => {
    if (!newWeight || isNaN(parseFloat(newWeight))) return;

    const newEntry: TrackingData = {
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(newWeight),
      tdee: currentTDEE,
      goal: selectedGoal
    };

    const updatedData = [...trackingData, newEntry]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setTrackingData(updatedData);
    setNewWeight('');
    setShowAddForm(false);
  };

  const getWeightTrend = () => {
    if (trackingData.length < 2) return null;
    
    const recent = trackingData.slice(-7); // Last 7 entries
    const firstWeight = recent[0].weight;
    const lastWeight = recent[recent.length - 1].weight;
    const change = lastWeight - firstWeight;
    
    return {
      change,
      trend: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable'
    };
  };

  const weightTrend = getWeightTrend();

  const chartData = trackingData.map(entry => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: entry.weight,
    fullDate: entry.date
  }));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Scale className="w-5 h-5" />
          Weight Tracking
        </h3>
        <p className="text-sm text-gray-600">
          Track your progress without creating an account
        </p>
      </div>

      {/* Quick Stats */}
      {trackingData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-800">Current Weight</span>
            </div>
            <div className="text-2xl font-bold text-primary-900">
              {trackingData[trackingData.length - 1].weight} kg
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Entries</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {trackingData.length}
            </div>
          </div>

          {weightTrend && (
            <div className={`p-4 rounded-lg border ${
              weightTrend.trend === 'up' 
                ? 'bg-blue-50 border-blue-200' 
                : weightTrend.trend === 'down'
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {weightTrend.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                ) : weightTrend.trend === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-green-600" />
                ) : (
                  <Target className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm font-medium">7-Day Change</span>
              </div>
              <div className={`text-2xl font-bold ${
                weightTrend.trend === 'up' 
                  ? 'text-blue-900' 
                  : weightTrend.trend === 'down'
                  ? 'text-green-900'
                  : 'text-yellow-900'
              }`}>
                {weightTrend.change > 0 ? '+' : ''}{weightTrend.change.toFixed(1)} kg
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {trackingData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <h4 className="font-semibold text-gray-900 mb-4">Weight Progress</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `Date: ${payload[0].payload.fullDate}`;
                    }
                    return label;
                  }}
                  formatter={(value: number) => [`${value} kg`, 'Weight']}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Add Weight Form */}
      {showAddForm ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <h4 className="font-semibold text-gray-900 mb-4">Add Weight Entry</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="70.5"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Goal
                </label>
                <select
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="lose">Lose Weight</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain">Gain Weight</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={addEntry}
                disabled={!newWeight}
                className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 hover:bg-primary-700 transition-colors"
              >
                Add Entry
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.button
          onClick={() => setShowAddForm(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full border-2 border-dashed border-gray-300 text-gray-600 py-8 rounded-xl hover:border-primary-300 hover:text-primary-600 transition-colors flex flex-col items-center gap-2"
        >
          <Plus className="w-6 h-6" />
          <span className="font-medium">Add Weight Entry</span>
          <span className="text-sm">Track your progress locally in your browser</span>
        </motion.button>
      )}

      {/* Privacy Note */}
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
          <div>
            <p className="text-sm text-green-800 font-medium">Privacy First</p>
            <p className="text-xs text-green-700 mt-1">
              All data is stored locally in your browser. Nothing is sent to our servers. 
              Your tracking data stays completely private.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}