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
              About This Calculator
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Created by Cristian Ortega, a Certified Personal Trainer, using a 
              proprietary 7-component formula that accounts for factors other 
              calculators miss.
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
              Why More Accurate?
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Unlike basic multiplier calculators, we factor in muscle mass, 
              job activity, NEAT, and recovery needs for personalized results.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 TDEE Calculator Pro. Built with precision, powered by science.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Want personalized coaching? <span className="text-primary-400 hover:text-primary-300 cursor-pointer">Get in touch</span>
          </p>
        </div>
      </div>
    </motion.footer>
  );
}