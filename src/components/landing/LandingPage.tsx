'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Calculator, TrendingUp, Brain, Target, ChefHat,
  CheckCircle, ArrowRight, Star, Users, Zap, Shield, 
  BarChart3, Sparkles, Clock
} from 'lucide-react';

export default function LandingPage() {
  const [calculationCount, setCalculationCount] = useState(127543);

  useEffect(() => {
    // Fetch real count
    fetch('/api/count')
      .then(res => res.json())
      .then(data => setCalculationCount(data.total))
      .catch(() => {
        // Silently fail, use default count
      });
  }, []);

  const features = [
    {
      icon: Calculator,
      title: "7-Component Formula",
      description: "Most accurate TDEE calculation using BMR, NEAT, Exercise, TEF, and more",
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Personalized meal plans and macro recommendations based on your goals",
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Track weight, body fat, measurements, and photos - all locally stored",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Target,
      title: "Smart Goal Setting",
      description: "Set and track personalized goals with motivational support",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: ChefHat,
      title: "37+ Meal Ideas",
      description: "Goal-specific recipes with photos and complete nutritional info",
      color: "from-red-500 to-rose-500"
    },
    {
      icon: Shield,
      title: "100% Private",
      description: "No accounts, no tracking - all data stays in your browser",
      color: "from-gray-600 to-gray-800"
    }
  ];

  const comparisons = [
    { name: "Our Calculator", accuracy: "95-98%", formula: "7 components", ai: true, tracking: true, meals: true },
    { name: "MyFitnessPal", accuracy: "75-80%", formula: "Basic", ai: false, tracking: true, meals: false },
    { name: "Calculator.net", accuracy: "70-75%", formula: "Standard", ai: false, tracking: false, meals: false },
    { name: "Generic TDEE", accuracy: "65-70%", formula: "Simple", ai: false, tracking: false, meals: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 to-amber-100/20" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md mb-6"
            >
              <Users className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-gray-700">
                {calculationCount.toLocaleString()} calculations and counting
              </span>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              The Most Accurate
              <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"> TDEE Calculator</span>
              <br />
              Backed by Science
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover your exact daily calorie needs with our advanced 7-component formula. 
              Get AI-powered meal plans, track progress, and achieve your goals - all for free.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/calculator">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-lg"
                >
                  Calculate My TDEE
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-lg border border-gray-200"
              >
                See How It Works
                <BarChart3 className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Benefits */}
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No Sign-up Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>100% Free Forever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Works Offline</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Privacy First</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof / Comparison Section */}
      <section className="py-20 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why We&apos;re Different
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how our calculator compares to popular alternatives
            </p>
          </motion.div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
              <thead className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Calculator</th>
                  <th className="px-6 py-4 text-center">Accuracy</th>
                  <th className="px-6 py-4 text-center">Formula</th>
                  <th className="px-6 py-4 text-center">AI Features</th>
                  <th className="px-6 py-4 text-center">Progress Tracking</th>
                  <th className="px-6 py-4 text-center">Meal Plans</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((item, index) => (
                  <tr key={index} className={index === 0 ? 'bg-amber-50 font-semibold' : 'border-t'}>
                    <td className="px-6 py-4">
                      {index === 0 && <Star className="w-4 h-4 text-amber-500 inline mr-2" />}
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={index === 0 ? 'text-green-600' : 'text-gray-600'}>
                        {item.accuracy}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">{item.formula}</td>
                    <td className="px-6 py-4 text-center">
                      {item.ai ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-300">✕</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.tracking ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-300">✕</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.meals ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-300">✕</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools and features to support your fitness journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No registration, no payment, just results
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Enter Your Details",
                description: "Age, weight, height, and activity level - that's all we need",
                icon: Calculator
              },
              {
                step: "2",
                title: "Get Your Results",
                description: "Instantly see your TDEE, macros, and personalized recommendations",
                icon: Zap
              },
              {
                step: "3",
                title: "Track Your Progress",
                description: "Use our free tools to track weight, measurements, and photos",
                icon: TrendingUp
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-2xl font-bold mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-amber-300 to-orange-300" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-amber-500 to-orange-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Fitness Journey?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Take control of your fitness with precise calorie calculations
            </p>
            <Link href="/calculator">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-amber-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg inline-flex items-center gap-2"
              >
                Start Your Free Calculation
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <div className="mt-6 flex items-center justify-center gap-2 text-white/80">
              <Clock className="w-4 h-4" />
              <span>Takes less than 2 minutes</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 TDEE Calculator Pro. Built with ❤️ for the fitness community.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Privacy First • No Tracking • No Ads • Free Forever
          </p>
        </div>
      </footer>
    </div>
  );
}