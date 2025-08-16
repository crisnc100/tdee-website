import TDEECalculator from '@/components/calculator/TDEECalculator';
import InfoSidebar from '@/components/layout/InfoSidebar';
import FAQSection from '@/components/layout/FAQSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-12 relative overflow-hidden">
      {/* Dynamic background patterns */}
      <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 via-transparent to-cyan-500/20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(34,197,94,0.15)_0%,transparent_40%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(249,115,22,0.15)_0%,transparent_40%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_10%,rgba(6,182,212,0.1)_0%,transparent_50%)] pointer-events-none"></div>
      
      {/* Animated mesh pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400 to-green-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-4">
            Advanced TDEE Calculator
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Discover your calorie needs with the CalorieScope formula - 
            a comprehensive approach that accounts for muscle mass, daily activity, and recovery needs.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TDEECalculator />
          </div>
          
          <div className="lg:col-span-1">
            <InfoSidebar />
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-8 border border-white/30">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Use the CalorieScope TDEE Calculator?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Advanced Formula</h3>
              <p className="text-sm text-gray-600">
                Goes beyond basic calculators by factoring in muscle mass, daily steps, and specific exercise patterns.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">Personalized Results</h3>
              <p className="text-sm text-gray-600">
                Get specific calorie and macro targets based on your unique body composition and activity level.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">Goal-Oriented</h3>
              <p className="text-sm text-gray-600">
                Receive tailored recommendations whether you want to lose weight, build muscle, or maintain.
              </p>
            </div>
          </div>
        </div>

        <FAQSection />
      </div>
    </div>
  );
}
