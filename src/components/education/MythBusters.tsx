'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, X, Info } from 'lucide-react';

interface Myth {
  myth: string;
  truth: string;
  explanation: string;
  impact: 'high' | 'medium' | 'low';
}

const myths: Myth[] = [
  {
    myth: "1200 calories is the magic number for weight loss",
    truth: "Most adults need significantly more than 1200 calories",
    explanation: "1200 calories is below the BMR for 95% of adults. Studies show eating below BMR for extended periods reduces metabolic rate by 20-30%, causes significant muscle loss (up to 25% of weight lost), and creates hormonal imbalances affecting thyroid, cortisol, and reproductive hormones. Use our calculator to find YOUR actual needs.",
    impact: "high"
  },
  {
    myth: "Starvation mode will stop weight loss completely",
    truth: "Metabolic adaptation is real but doesn't stop weight loss",
    explanation: "The Minnesota Starvation Experiment showed metabolism slows by 15-20% during extreme restriction, but weight loss continues. The real danger: 83% of extreme dieters regain MORE weight within 2 years due to increased hunger hormones (ghrelin up 24%) and decreased satiety hormones (leptin down 35%).",
    impact: "high"
  },
  {
    myth: "You need to eat clean 100% of the time",
    truth: "The 80/20 rule is more sustainable and equally effective",
    explanation: "Research shows flexible dieting (IIFYM) produces identical fat loss to 'clean eating' when calories and protein are matched. People following flexible approaches have 78% better adherence rates and 50% less binge eating. Psychological restriction often triggers overconsumption - allow yourself planned indulgences.",
    impact: "high"
  },
  {
    myth: "Eating after 8 PM causes weight gain",
    truth: "Total daily calories matter, not meal timing",
    explanation: "Multiple studies comparing early vs late eating with equal calories show NO difference in fat loss. Your metabolism runs 24/7 - it doesn't slow at night. Late-night weight gain happens because people eat EXTRA calories (average 400-600) when snacking at night, not because of timing.",
    impact: "medium"
  },
  {
    myth: "You must eat 6 small meals to boost metabolism",
    truth: "Meal frequency doesn't affect total daily metabolism",
    explanation: "TEF (Thermic Effect of Food) is ~10% of total calories consumed, regardless of frequency. Studies comparing 3 vs 6 meals show identical metabolic rates when calories are equal. In fact, intermittent fasting (fewer meals) can increase growth hormone by 500% and improve insulin sensitivity by 20-30%.",
    impact: "medium"
  },
  {
    myth: "Spot reduction (losing fat from specific areas) works",
    truth: "Fat loss happens systemically based on genetics",
    explanation: "A study of tennis players showed no difference in arm fat despite one arm being significantly more muscular. Fat cells release energy based on hormones circulating throughout your entire body. You'll lose fat in reverse order of how you gained it - first on, last off. Keep going!",
    impact: "high"
  },
  {
    myth: "Cardio is the best way to lose weight",
    truth: "Resistance training is superior for body composition",
    explanation: "Cardio alone causes 25-30% of weight lost to be muscle. Weight training preserves 96% of muscle mass during fat loss. Each pound of muscle burns 6-10 calories daily at rest. A 12-week study showed weight training created 40% more fat loss than cardio alone when diet was controlled.",
    impact: "high"
  },
  {
    myth: "Women will get bulky from lifting weights",
    truth: "Women lack the hormones to build large muscles easily",
    explanation: "Women have 15-20x less testosterone and 60% less muscle-building capacity than men. Female bodybuilders train 15-20 hours weekly for YEARS and often use enhancement. Regular weight training (3-4x/week) increases women's metabolism by 7%, reduces body fat by 3-4%, and creates the 'toned' athletic look.",
    impact: "high"
  },
  {
    myth: "You need expensive supplements to see results",
    truth: "Only 3 supplements have strong scientific evidence",
    explanation: "99% of supplements lack evidence. Only creatine (5g/day increases strength 5-15%), caffeine (3-6mg/kg improves performance 3-7%), and protein powder (if diet lacks protein) consistently work. The supplement industry makes $35 billion yearly selling hope. Save your money - focus on food, training, and sleep.",
    impact: "high"
  },
  {
    myth: "Detox teas and juice cleanses remove toxins",
    truth: "Your liver and kidneys detox 24/7 for free",
    explanation: "No study has ever identified which 'toxins' these products remove. Your liver processes 1.5L of blood per minute, filtering everything. Detox products are just expensive laxatives and diuretics causing temporary water loss (2-5 lbs) that returns within 48 hours. Total scam.",
    impact: "high"
  },
  {
    myth: "Muscle turns into fat when you stop exercising",
    truth: "Muscle and fat are completely different tissues",
    explanation: "Muscle cells and fat cells are as different as bone and skin - one cannot become the other. When you stop training, muscles atrophy (shrink) by 20-30% in 2-3 months. People gain fat because they maintain high calories while burning 300-500 fewer daily from lost muscle and reduced activity.",
    impact: "medium"
  },
  {
    myth: "You need to cut carbs to lose fat",
    truth: "All macronutrient ratios work if calories/protein are controlled",
    explanation: "Meta-analysis of 32 studies shows no difference in fat loss between low-carb and low-fat when calories and protein (0.7-1g/lb) are matched. Carbs fuel performance - elite athletes eat 300-600g daily. Choose the approach you can sustain. Adherence beats optimization every time.",
    impact: "medium"
  }
];

export default function MythBusters() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const mythsPerPage = 3;
  
  const paginatedMyths = myths.slice(
    currentPage * mythsPerPage,
    (currentPage + 1) * mythsPerPage
  );

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <div className="bg-card rounded-xl p-3 sm:p-6 shadow-lg border border-border">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
        <h3 className="text-base sm:text-xl font-bold text-foreground">Common Fitness Myths Debunked</h3>
      </div>

      <div className="space-y-4">
        {paginatedMyths.map((myth, index) => {
          const actualIndex = currentPage * mythsPerPage + index;
          const isExpanded = expandedIndex === actualIndex;
          
          return (
            <motion.div
              key={actualIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : actualIndex)}
                className="w-full p-3 sm:p-4 text-left hover:bg-muted transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <div className="space-y-3">
                      {/* Myth */}
                      <div className="flex items-start gap-2">
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">Myth</p>
                          <p className="text-sm sm:text-base text-foreground leading-relaxed">
                            {myth.myth}
                          </p>
                        </div>
                      </div>
                      
                      {/* Truth */}
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Truth</p>
                          <p className="text-sm sm:text-base text-foreground leading-relaxed">
                            {myth.truth}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 mt-2 sm:mt-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(myth.impact)}`}>
                      {myth.impact} impact
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Info className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    </motion.div>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-border"
                  >
                    <div className="p-3 sm:p-4 bg-muted">
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                        {myth.explanation}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      {myths.length > mythsPerPage && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 0
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            Previous
          </button>
          
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {Math.ceil(myths.length / mythsPerPage)}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(Math.ceil(myths.length / mythsPerPage) - 1, currentPage + 1))}
            disabled={currentPage >= Math.ceil(myths.length / mythsPerPage) - 1}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              currentPage >= Math.ceil(myths.length / mythsPerPage) - 1
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            Next
          </button>
        </div>
      )}

      <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">💡 The Truth:</span> 90% of fitness advice is marketing BS. The science is simple: 
          maintain a moderate calorie deficit (15-25%), eat 0.7-1g protein per pound, lift weights 3-4x weekly, 
          sleep 7-9 hours, and be patient. That's literally it. Everything else is noise designed to sell you something.
        </p>
      </div>
    </div>
  );
}