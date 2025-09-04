'use client';

import { motion } from 'framer-motion';
import { Heart, Shield, Star } from 'lucide-react';
import { useCoachingModal } from '@/hooks/useCoachingModal';
import CoachingModal from '@/components/coaching/CoachingModal';
import Link from 'next/link';

export default function Footer() {
  const { isOpen, source, openModal, closeModal } = useCoachingModal();

  return (
    <>
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
              No BS Approach
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Straightforward calorie calculations without inflated claims. 
              Get your daily needs calculated honestly and accurately.
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
            Built by Cristian Ortega, CPT | 
            <button
              onClick={() => openModal('footer')}
              className="text-primary-400 hover:text-primary-300 ml-1 cursor-pointer"
            >
              Available for 1-on-1 coaching
            </button>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Part of OrtegaFit | Engineering Fitness Solutions
          </p>
          <p className="text-xs text-gray-600 mt-2">
            © 2024 MyCalorieLog. Questions or coaching inquiries? 
            <button
              onClick={() => openModal('footer')}
              className="text-primary-400 hover:text-primary-300 ml-1 cursor-pointer"
            >
              Get in touch
            </button>
          </p>
          <div className="text-xs text-gray-600 mt-4 space-x-4">
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">
              Privacy Policy
            </Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </motion.footer>
    
    <CoachingModal 
      isOpen={isOpen}
      onClose={closeModal}
      source={source as "footer" | "results" | "other"}
    />
    </>
  );
}