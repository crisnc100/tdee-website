import { Shield, Target, TrendingUp, Users } from 'lucide-react';

export default function InfoSidebar() {
  return (
    <div className="space-y-6">
      {/* Privacy First */}
      <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-foreground">Privacy First</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No accounts required. All calculations and tracking happen locally in your browser. 
          Your data never leaves your device.
        </p>
      </div>

      {/* About Creator */}
      <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">About MyCalorieLog</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          I created this calculator because understanding your calorie needs is fundamental to achieving any fitness goal. 
          Most online calculators are inaccurate, with studies showing error margins of 20-40%. These false numbers can derail your progress.
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          While no calculator is perfect, I've minimized the error margin by accounting for factors others ignore. 
          This helps anyone, anywhere get a more accurate foundation for their fitness journey.
        </p>
        <div className="text-xs bg-muted text-foreground px-3 py-2 rounded-lg">
          <strong>Created by:</strong> Cristian Ortega, CPT (NASM-CPT, Precision Nutrition Level 1)
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">How It Works</h3>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="font-medium text-accent min-w-[20px]">1.</span>
            <span>Calculate your Base Metabolic Rate (BMR)</span>
          </div>
          <div className="flex gap-3">
            <span className="font-medium text-accent min-w-[20px]">2.</span>
            <span>Factor in muscle mass and body composition</span>
          </div>
          <div className="flex gap-3">
            <span className="font-medium text-accent min-w-[20px]">3.</span>
            <span>Add job activity and daily movement (NEAT)</span>
          </div>
          <div className="flex gap-3">
            <span className="font-medium text-accent min-w-[20px]">4.</span>
            <span>Include exercise and recovery needs</span>
          </div>
          <div className="flex gap-3">
            <span className="font-medium text-accent min-w-[20px]">5.</span>
            <span>Provide confidence intervals for accuracy</span>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">Quick Tips</h3>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            <span>Track your weight for 2-3 weeks to validate results</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            <span>Recalculate when weight changes by ±10 lbs</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            <span>Use the confidence range for better accuracy</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            <span>Body fat % measurement improves precision</span>
          </div>
        </div>
      </div>
    </div>
  );
}