import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | TDEE Calculator',
};

export default function TermsOfService() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
          </div>

          <p className="text-muted-foreground mb-8">Last updated: November 2026</p>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Using this site</h2>
              <p className="leading-relaxed">
                This site provides a free calculator that estimates your total daily energy
                expenditure (TDEE), plus short educational notes. By using it you agree to these terms.
              </p>
            </section>

            <section className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Not medical advice
              </h2>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  The calculator and its content are for general information only. They are not a
                  substitute for professional medical or nutritional advice, diagnosis or treatment.
                </p>
                <p className="leading-relaxed">
                  Talk to a doctor or registered dietitian before making significant changes to your
                  diet or exercise, especially if you are pregnant, have a medical condition or take
                  medication.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Accuracy</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>Results are estimates based on published formulas and the values you enter</li>
                <li>Individual energy needs vary, sometimes by a lot</li>
                <li>No particular health or fitness outcome is promised</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">No warranty</h2>
              <p className="leading-relaxed">
                The site is provided &quot;as is&quot;, without warranties of any kind. To the extent
                the law allows, there is no liability for any loss or damage arising from its use.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Changes</h2>
              <p className="leading-relaxed">
                These terms may be updated from time to time. The current version is always on this page.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <Link href="/" className="inline-flex items-center gap-2 text-accent hover:underline font-medium">
              ← Back to Calculator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
