import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { BackLink, DashList, DocSection, DocSheet } from '@/components/ui/lab';

export const metadata: Metadata = {
  title: 'Terms of Service | TDEE Calculator',
};

export default function TermsOfService() {
  return (
    <DocSheet label="Terms" title="Terms of Service" updated="Last updated: November 2026">
      <DocSection index={1} title="Using this site">
        <p>
          This site provides a free calculator that estimates your total daily energy
          expenditure (TDEE), plus short educational notes. By using it you agree to these terms.
        </p>
      </DocSection>

      <section className="my-6 border border-warning rounded-[3px] overflow-hidden">
        <div aria-hidden="true" className="h-1.5 hazard" />
        <div className="p-4 sm:p-5">
          <h2 className="label-caps text-warning mb-3 flex items-center gap-2">
            <AlertCircle aria-hidden="true" className="w-4 h-4" />
            Not medical advice
          </h2>
          <div className="space-y-3 text-foreground leading-relaxed">
            <p>
              The calculator and its content are for general information only. They are not a
              substitute for professional medical or nutritional advice, diagnosis or treatment.
            </p>
            <p>
              Talk to a doctor or registered dietitian before making significant changes to your
              diet or exercise, especially if you are pregnant, have a medical condition or take
              medication.
            </p>
          </div>
        </div>
      </section>

      <DocSection index={2} title="Accuracy" className="border-t">
        <DashList
          items={[
            'Results are estimates based on published formulas and the values you enter',
            'Individual energy needs vary, sometimes by a lot',
            'No particular health or fitness outcome is promised',
          ]}
        />
      </DocSection>

      <DocSection index={3} title="No warranty">
        <p>
          The site is provided &quot;as is&quot;, without warranties of any kind. To the extent
          the law allows, there is no liability for any loss or damage arising from its use.
        </p>
      </DocSection>

      <DocSection index={4} title="Changes">
        <p>
          These terms may be updated from time to time. The current version is always on this page.
        </p>
      </DocSection>

      <BackLink href="/">← Back to Calculator</BackLink>
    </DocSheet>
  );
}
