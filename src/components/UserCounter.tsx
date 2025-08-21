'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp } from 'lucide-react';

interface CountData {
  total: number;
  today: number;
}

export default function UserCounter() {
  const [counts, setCounts] = useState<CountData>({ total: 0, today: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetchCounts();

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchCounts, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchCounts = async () => {
    try {
      const response = await fetch('/api/count');
      const data = await response.json();
      setCounts(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch counts:', error);
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse flex items-center gap-6">
        <div className="h-12 w-32 bg-white/10 rounded-lg"></div>
        <div className="h-12 w-32 bg-white/10 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="inline-flex flex-wrap items-center justify-center gap-4 bg-white/95 backdrop-blur-md rounded-full px-6 py-3 shadow-lg border border-orange-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">
                {formatNumber(counts.total)}
              </span>
              <span className="text-sm text-gray-600">calculations made</span>
            </div>
          </div>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-gray-900">
                {formatNumber(counts.today)}
              </span>
              <span className="text-sm text-gray-600">today</span>
            </div>
          </div>
        </div>
        
        <p className="mt-3 text-sm text-gray-700 font-medium">
          Join thousands who trust our advanced formula for accurate TDEE calculations
        </p>
      </motion.div>
    </div>
  );
}