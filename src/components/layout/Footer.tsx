'use client';

import { motion } from 'framer-motion';
import { Heart, Shield, Star } from 'lucide-react';

export default function Footer() {
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-gray-900 text-white"
    >
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              7-Component Formula
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Our proprietary formula accounts for muscle mass, NEAT, recovery,
              and factors other calculators miss for maximum accuracy.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-500" />
              Privacy First
            </h3>
            <p className="text-gray-300 leading-relaxed">
              No accounts required. All calculations and tracking happen 
              locally in your browser. Your data never leaves your device.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Free Forever
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Access all features including AI coaching, meal plans, and 
              progress tracking without any cost or subscription.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 CalorieScope. Built with precision, powered by science.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Questions or feedback? <span className="text-primary-400 hover:text-primary-300 cursor-pointer">Let us know</span>
          </p>
        </div>
      </div>
    </motion.footer>
  );
}