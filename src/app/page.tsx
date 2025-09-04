import TDEECalculator from '@/components/calculator/TDEECalculator';
import InfoSidebar from '@/components/layout/InfoSidebar';
import FAQSection from '@/components/layout/FAQSection';
import UserCounter from '@/components/UserCounter';
// import NotificationManager from '@/components/NotificationManager'; // Disabled for MVP

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/30 to-orange-100/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-200/20 to-amber-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        {/* User Counter Section */}
        <UserCounter />
        
        {/* Notification Manager - Disabled for MVP */}
        {/* <NotificationManager /> */}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 w-full">
              <TDEECalculator />
            </div>
            <div className="w-full lg:w-96 lg:sticky lg:top-8">
              <InfoSidebar />
            </div>
          </div>
        </div>

        <FAQSection />
      </div>
    </main>
  );
}