import { FileText, Scale, AlertCircle, CheckCircle, Ban, Mail } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
          </div>
          
          <p className="text-muted-foreground mb-8">
            Last updated: December {new Date().getFullYear()}
          </p>

          <div className="space-y-8 text-foreground">
            {/* Agreement */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Scale className="w-5 h-5 text-accent" />
                Agreement to Terms
              </h2>
              <p className="leading-relaxed">
                By accessing or using MyCalorieLog, you agree to be bound by these Terms of Service. 
                If you disagree with any part of these terms, you may not access our service.
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Service Description
              </h2>
              <p className="leading-relaxed mb-3">
                MyCalorieLog provides:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>TDEE (Total Daily Energy Expenditure) calculator</li>
                <li>Macro nutrient calculators and recommendations</li>
                <li>AI-powered meal suggestions (when available)</li>
                <li>Educational fitness and nutrition content</li>
                <li>Progressive Web App for offline access</li>
              </ul>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Acceptable Use
              </h2>
              <p className="leading-relaxed mb-3">
                You agree to use MyCalorieLog only for lawful purposes and in accordance with these Terms. 
                You agree to:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Use the calculators and tools for personal fitness planning</li>
                <li>Provide accurate information when using our tools</li>
                <li>Respect the intellectual property rights of the service</li>
                <li>Use AI features responsibly and within provided limits</li>
              </ul>
            </section>

            {/* Prohibited Uses */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-600" />
                Prohibited Uses
              </h2>
              <p className="leading-relaxed mb-3">
                You may not:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Attempt to bypass any limitations or restrictions</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Attempt to access the service through automated means</li>
                <li>Resell or commercialize the service without permission</li>
              </ul>
            </section>

            {/* Medical Disclaimer */}
            <section className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Medical Disclaimer
              </h2>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  <strong>Not Medical Advice:</strong> MyCalorieLog provides tools for educational 
                  and informational purposes only. The content is not intended to be a substitute 
                  for professional medical advice, diagnosis, or treatment.
                </p>
                <p className="leading-relaxed">
                  <strong>Consult Professionals:</strong> Always seek the advice of your physician, 
                  nutritionist, or other qualified health provider with any questions regarding 
                  a medical condition or dietary changes.
                </p>
                <p className="leading-relaxed">
                  <strong>Use at Your Own Risk:</strong> Any reliance on the information provided 
                  by MyCalorieLog is solely at your own risk.
                </p>
              </div>
            </section>

            {/* Accuracy of Information */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Accuracy of Calculations
              </h2>
              <p className="leading-relaxed">
                While we strive to provide accurate calculations and suggestions:
              </p>
              <ul className="mt-2 space-y-2 list-disc list-inside">
                <li>TDEE calculations are estimates based on statistical formulas</li>
                <li>Individual results may vary significantly</li>
                <li>AI suggestions are generated and may not be perfect</li>
                <li>We make no guarantees about specific fitness or health outcomes</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Intellectual Property
              </h2>
              <p className="leading-relaxed">
                The service and its original content, features, and functionality are owned by 
                MyCalorieLog and are protected by international copyright, trademark, and other 
                intellectual property laws.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Limitation of Liability
              </h2>
              <p className="leading-relaxed">
                To the maximum extent permitted by law, MyCalorieLog shall not be liable for any 
                indirect, incidental, special, consequential, or punitive damages resulting from 
                your use or inability to use the service.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Changes to Terms
              </h2>
              <p className="leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. If a revision 
                is material, we will provide notice on our website prior to any new terms taking effect.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Termination
              </h2>
              <p className="leading-relaxed">
                We may terminate or suspend your access to the service immediately, without prior 
                notice or liability, for any reason whatsoever, including without limitation if 
                you breach the Terms.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-accent" />
                Contact Information
              </h2>
              <p className="leading-relaxed">
                For questions about these Terms, please contact us through the form on our website.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-accent hover:underline font-medium"
            >
              ← Back to Calculator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}