'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Calendar, MessageSquare, Target, Award, Users, Clock } from 'lucide-react';

interface CoachingModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: 'footer' | 'results' | 'other';
}

export default function CoachingModal({ isOpen, onClose, source = 'other' }: CoachingModalProps) {
  const [currentStep, setCurrentStep] = useState<'intro' | 'form' | 'success'>('intro');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    goal: '',
    experience: '',
    commitment: '',
    challenges: '',
    preferredContact: 'email'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Redirect to trainwithcris.fit
    window.open('https://trainwithcris.fit', '_blank');
    
    setCurrentStep('success');
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      onClose();
      setCurrentStep('intro');
      setFormData({
        name: '',
        email: '',
        phone: '',
        goal: '',
        experience: '',
        commitment: '',
        challenges: '',
        preferredContact: 'email'
      });
    }, 5000);
  };

  const benefits = [
    { icon: Target, text: 'Personalized nutrition & training plans' },
    { icon: MessageSquare, text: 'Weekly check-ins & adjustments' },
    { icon: Award, text: 'Form checks & technique guidance' },
    { icon: Users, text: 'Accountability & motivation support' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 border-b border-gray-200">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                Transform Your Fitness Journey
              </h2>
              <p className="text-gray-600 mt-1">
                Get personalized 1-on-1 coaching from a certified personal trainer
              </p>
            </div>

            <div className="p-6">
              {currentStep === 'intro' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Coach Introduction */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <img
                        src="/assets/professional-photo.jpg"
                        alt="Cristian Ortega"
                        className="w-[88px] h-[88px] rounded-full object-cover border-2 border-white shadow-lg flex-shrink-0"
                        style={{ objectPosition: '50% 5%' }}
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Cristian Ortega, NASM-CPT
                        </h3>
                        <p className="text-gray-600 mt-1">
                          Personal Trainer • Software Engineer • 5+ Years Experience
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Natural bodybuilding competitor helping clients from 18 to 84 achieve their goals. 
                          Creator of FlexBreak stretching app.
                        </p>
                        <p className="text-sm text-gray-600 italic mt-2">
                          "I believe in sustainable fitness without sacrificing the foods you love"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* What You Get */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      What's Included in Your Free Consultation:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {benefits.map((benefit, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-3"
                        >
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <benefit.icon className="w-5 h-5 text-primary-600" />
                          </div>
                          <span className="text-sm text-gray-700">{benefit.text}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Success Stories */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 italic">
                      "At 84 years old, I achieved my first pull-up thanks to Cristian's 
                      personalized training and encouragement. Never thought it was possible!"
                    </p>
                    <p className="text-xs text-gray-500 mt-2">— Steve Barsby</p>
                  </div>

                  {/* Contact Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <strong>Prefer to contact directly?</strong> Visit{' '}
                      <a 
                        href="https://trainwithcris.fit" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        trainwithcris.fit
                      </a>
                    </p>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setCurrentStep('form')}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 cursor-pointer"
                    >
                      <Clock className="w-4 h-4 inline mr-2" />
                      Schedule Free Consultation
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Maybe Later
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 'form' && (
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Goal *
                    </label>
                    <select
                      required
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select your main goal</option>
                      <option value="weight-loss">Weight Loss</option>
                      <option value="muscle-gain">Muscle Gain</option>
                      <option value="strength">Strength Building</option>
                      <option value="body-recomp">Body Recomposition</option>
                      <option value="performance">Athletic Performance</option>
                      <option value="health">General Health & Wellness</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Level *
                    </label>
                    <select
                      required
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select your experience</option>
                      <option value="beginner">Beginner (0-6 months)</option>
                      <option value="intermediate">Intermediate (6 months - 2 years)</option>
                      <option value="advanced">Advanced (2+ years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Commitment *
                    </label>
                    <select
                      required
                      value={formData.commitment}
                      onChange={(e) => setFormData({ ...formData, commitment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">How much time can you commit?</option>
                      <option value="2-3-days">2-3 days per week</option>
                      <option value="3-4-days">3-4 days per week</option>
                      <option value="5-6-days">5-6 days per week</option>
                      <option value="daily">Daily commitment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Challenges (Optional)
                    </label>
                    <textarea
                      value={formData.challenges}
                      onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                      placeholder="What's been holding you back from reaching your goals?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Contact Method
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="email"
                          checked={formData.preferredContact === 'email'}
                          onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                          className="mr-2"
                        />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="phone"
                          checked={formData.preferredContact === 'phone'}
                          onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                          className="mr-2"
                        />
                        <span className="text-sm">Phone</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      Request Free Consultation
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep('intro')}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </motion.form>
              )}

              {currentStep === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Redirecting You Now!
                  </h3>
                  <p className="text-gray-600">
                    You're being redirected to trainwithcris.fit where you can get in touch and schedule your consultation.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    If the page didn't open automatically, visit: <a href="https://trainwithcris.fit" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">trainwithcris.fit</a>
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}