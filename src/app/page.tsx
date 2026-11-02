import TDEECalculator from '@/components/calculator/TDEECalculator';
import InfoSidebar from '@/components/layout/InfoSidebar';
import FAQSection from '@/components/layout/FAQSection';

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <div className="flex-1 w-full min-w-0">
            <TDEECalculator />
          </div>
          <div className="w-full lg:w-96 lg:sticky lg:top-20">
            <InfoSidebar />
          </div>
        </div>
      </div>

      <FAQSection />
    </div>
  );
}
