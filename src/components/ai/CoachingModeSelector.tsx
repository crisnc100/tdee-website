'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  AlertTriangle, 
  BookOpen, 
  BarChart3, 
  Info, 
  Sparkles,
  Brain,
  Target,
  CheckCircle 
} from 'lucide-react';
import { CoachingMode } from '@/lib/aiCoaching';
import { AIModelId, AI_MODELS } from '@/types/ai';

interface CoachingModeSelectorProps {
  selectedMode: CoachingMode;
  onModeChange: (mode: CoachingMode) => void;
  onModelRecommendationAccepted?: (modelId: AIModelId) => void;
  className?: string;
  showModelRecommendations?: boolean;
}

interface ModeConfig {
  id: CoachingMode;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  recommendedModel: AIModelId;
  benefits: string[];
  bestFor: string[];
  warning?: string;
}

const COACHING_MODES: ModeConfig[] = [
  {
    id: 'supportive',
    name: 'Supportive Coach',
    description: 'Encouraging, motivational guidance that builds confidence and provides balanced advice',
    icon: Heart,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200 hover:border-green-300',
    recommendedModel: 'gpt-4o-mini',
    benefits: [
      'Motivational and encouraging tone',
      'Balanced, sustainable advice',
      'Acknowledges challenges while staying positive',
      'Practical tips for busy lifestyles'
    ],
    bestFor: [
      'People starting their fitness journey',
      'Those needing motivation and confidence',
      'Users who prefer gentle guidance',
      'Anyone looking for sustainable habits'
    ]
  },
  {
    id: 'reality-check',
    name: 'Reality Check',
    description: 'Direct, honest feedback that cuts through myths and delivers evidence-based truth',
    icon: AlertTriangle,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200 hover:border-orange-300',
    recommendedModel: 'gpt-4o-mini',
    benefits: [
      'No-nonsense, honest assessment',
      'Myth-busting with evidence',
      'Realistic expectation setting',
      'Challenges common misconceptions'
    ],
    bestFor: [
      'Experienced fitness enthusiasts',
      'People with unrealistic expectations',
      'Those who want direct feedback',
      'Users ready for tough love'
    ],
    warning: 'This mode provides direct, potentially challenging feedback. Choose if you\'re ready for honest assessments.'
  },
  {
    id: 'educational',
    name: 'Educational Expert',
    description: 'Detailed explanations with scientific backing to help you understand the why behind advice',
    icon: BookOpen,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200 hover:border-blue-300',
    recommendedModel: 'qwen2.5-7b-instruct',
    benefits: [
      'Science-based explanations',
      'Detailed reasoning behind advice',
      'Learning-focused approach',
      'Builds long-term understanding'
    ],
    bestFor: [
      'People who want to understand the science',
      'Those interested in learning mechanisms',
      'Users who prefer detailed explanations',
      'Anyone building knowledge foundation'
    ]
  },
  {
    id: 'analytical',
    name: 'Data Analyst',
    description: 'Numbers-driven insights using your specific data to create personalized recommendations',
    icon: BarChart3,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200 hover:border-purple-300',
    recommendedModel: 'gemini-2.0-flash-exp',
    benefits: [
      'Data-driven recommendations',
      'Specific calculations and projections',
      'Quantified optimization strategies',
      'Mathematical precision in advice'
    ],
    bestFor: [
      'Data-oriented individuals',
      'Those who like specific numbers',
      'People optimizing their approach',
      'Users wanting detailed analysis'
    ]
  }
];

export default function CoachingModeSelector({
  selectedMode,
  onModeChange,
  onModelRecommendationAccepted,
  className = '',
  showModelRecommendations = true
}: CoachingModeSelectorProps) {
  const [expandedMode, setExpandedMode] = useState<CoachingMode | null>(null);
  const [showModelInfo, setShowModelInfo] = useState(false);

  const selectedConfig = COACHING_MODES.find(mode => mode.id === selectedMode);

  const handleModeSelect = (mode: CoachingMode) => {
    onModeChange(mode);
    setExpandedMode(null);
  };

  const handleModelRecommendationClick = (modelId: AIModelId) => {
    onModelRecommendationAccepted?.(modelId);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Coaching Style
        </h3>
        <p className="text-sm text-gray-600">
          Choose how you'd like to receive your personalized fitness advice
        </p>
      </div>

      {/* Mode Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {COACHING_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          const isExpanded = expandedMode === mode.id;
          const Icon = mode.icon;

          return (
            <motion.div
              key={mode.id}
              layout
              className={`
                relative cursor-pointer rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? `${mode.bgColor} ${mode.borderColor.replace('hover:', '')} ring-2 ring-offset-1 ring-${mode.color.split('-')[1]}-300`
                  : `bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm`
                }
              `}
            >
              {/* Main Mode Card */}
              <div
                className="p-4"
                onClick={() => {
                  if (isSelected) {
                    setExpandedMode(isExpanded ? null : mode.id);
                  } else {
                    handleModeSelect(mode.id);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isSelected ? mode.bgColor : 'bg-gray-100'}
                  `}>
                    <Icon className={`w-5 h-5 ${isSelected ? mode.color : 'text-gray-600'}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{mode.name}</h4>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{mode.description}</p>

                    {mode.warning && isSelected && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>{mode.warning}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommended Model Badge */}
                {isSelected && showModelRecommendations && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-xs text-gray-600">Recommended AI:</span>
                        <span className="text-xs font-medium text-purple-700">
                          {AI_MODELS[mode.recommendedModel].name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModelRecommendationClick(mode.recommendedModel);
                        }}
                        className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      >
                        Use This Model
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200 p-4 bg-gray-50"
                >
                  <div className="space-y-4">
                    {/* Benefits */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-600" />
                        Key Benefits
                      </h5>
                      <ul className="space-y-1">
                        {mode.benefits.map((benefit, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-1" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Best For */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-600" />
                        Best For
                      </h5>
                      <ul className="space-y-1">
                        {mode.bestFor.map((item, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="w-1 h-1 bg-blue-400 rounded-full flex-shrink-0 mt-2"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Selected Mode Summary */}
      {selectedConfig && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${selectedConfig.bgColor} flex items-center justify-center`}>
              <selectedConfig.icon className={`w-4 h-4 ${selectedConfig.color}`} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                Selected: {selectedConfig.name}
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                Your coaching will use an {selectedConfig.name.toLowerCase()} approach
                {showModelRecommendations && (
                  <span> with {AI_MODELS[selectedConfig.recommendedModel].name} optimization</span>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowModelInfo(!showModelInfo)}
              className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <Info className="w-3 h-3" />
              {showModelInfo ? 'Hide' : 'Why?'}
            </button>
          </div>

          {/* Model Information */}
          {showModelInfo && showModelRecommendations && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-purple-200"
            >
              <div className="text-xs text-gray-600 space-y-2">
                <p>
                  <strong>{AI_MODELS[selectedConfig.recommendedModel].name}</strong> is recommended for {selectedConfig.name.toLowerCase()} coaching because:
                </p>
                <p className="italic">
                  {AI_MODELS[selectedConfig.recommendedModel].description}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    {AI_MODELS[selectedConfig.recommendedModel].pricing.isFree ? 'Free' : 'Paid'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    {AI_MODELS[selectedConfig.recommendedModel].performance.avgResponseTime}s avg
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    Quality: {Math.round(AI_MODELS[selectedConfig.recommendedModel].performance.qualityScore * 100)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          💡 You can switch coaching styles anytime to get different perspectives on your fitness journey
        </p>
      </div>
    </div>
  );
}