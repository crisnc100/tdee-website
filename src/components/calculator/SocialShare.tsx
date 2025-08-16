'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TDEEResult } from '@/types/calculator';
import { Share2, Copy, Check, Twitter, MessageCircle, Link } from 'lucide-react';

interface SocialShareProps {
  result: TDEEResult;
  shareId: string;
}

export default function SocialShare({ result, shareId }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${shareId}`;
  const shareText = `🔥 Just calculated my TDEE: ${result.tdee.toLocaleString()} calories/day using the most accurate calculator! 

Unlike basic calculators, this uses a 7-component formula that's 300-500 calories more precise.

Calculate yours: ${shareUrl}

#TDEE #Fitness #Nutrition`;

  const twitterText = `🔥 My TDEE: ${result.tdee.toLocaleString()} cal/day

Calculated with a precision 7-component formula that beats basic calculators by 300-500 calories!

Try it: ${shareUrl}

#TDEE #Fitness`;

  const whatsappText = `🔥 Just found the most accurate TDEE calculator!

My result: ${result.tdee.toLocaleString()} calories/day

This uses a 7-component formula that's way more precise than basic calculators. Check it out: ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
    window.open(url, '_blank');
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Share2 className="w-5 h-5 text-primary-600" />
          <h3 className="text-xl font-bold text-gray-900">Share Your Results</h3>
        </div>
        <p className="text-sm text-gray-600">
          Help others discover more accurate TDEE calculations
        </p>
      </div>

      {/* Share Card Preview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl text-white"
      >
        <div className="text-center">
          <h4 className="text-lg font-semibold mb-2">🔥 My TDEE Result</h4>
          <div className="text-4xl font-bold mb-2">{result.tdee.toLocaleString()}</div>
          <p className="text-sm opacity-90 mb-4">calories per day</p>
          
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
            <p className="text-xs">
              Calculated with a precision 7-component formula
              <br />
              More accurate than basic multiplier calculators
            </p>
          </div>
        </div>
      </motion.div>

      {/* Share Options */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your shareable link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
            />
            <motion.button
              onClick={handleCopyLink}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <motion.button
            onClick={handleTwitterShare}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            <Twitter className="w-5 h-5" />
            Share on Twitter
          </motion.button>

          <motion.button
            onClick={handleWhatsAppShare}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Share on WhatsApp
          </motion.button>

          <motion.button
            onClick={handleCopyLink}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            <Link className="w-5 h-5" />
            Copy Link
          </motion.button>
        </div>
      </div>

      {/* Social Proof */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-4 bg-primary-50 rounded-lg border border-primary-200 text-center"
      >
        <p className="text-sm text-primary-800">
          <span className="font-semibold">Join thousands</span> who've discovered more accurate TDEE calculations!
        </p>
        <p className="text-xs text-primary-600 mt-1">
          Your shared link expires in 30 days
        </p>
      </motion.div>
    </div>
  );
}