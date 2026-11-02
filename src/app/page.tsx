import TDEECalculator from '@/components/calculator/TDEECalculator';
import InfoSidebar from '@/components/layout/InfoSidebar';
import FAQSection from '@/components/layout/FAQSection';
import UserCounter from '@/components/UserCounter';
// import NotificationManager from '@/components/NotificationManager'; // Disabled for MVP

export default function Home() {
  return (
    <main className="min-h-screen">
      <div>
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