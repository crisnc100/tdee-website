import { Shield, Database, Lock, Cookie, Mail, Globe } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          </div>
          
          <p className="text-muted-foreground mb-8">
            Last updated: December {new Date().getFullYear()}
          </p>

          <div className="space-y-8 text-foreground">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-accent" />
                Introduction
              </h2>
              <p className="leading-relaxed">
                MyCalorieLog ("we", "our", or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we handle information when you use our 
                TDEE calculator and fitness tools at mycalorielog.com.
              </p>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-accent" />
                Information We Collect
              </h2>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  <strong>Local Storage Only:</strong> All calculator inputs, preferences, and 
                  settings are stored locally in your browser. We do not collect or transmit 
                  this data to our servers.
                </p>
                <p className="leading-relaxed">
                  <strong>Anonymous Usage Data:</strong> We use a simple visitor counter that 
                  tracks the total number of unique visitors. No personal information is 
                  collected or associated with this count.
                </p>
                <p className="leading-relaxed">
                  <strong>AI Features:</strong> When you use AI-powered features (meal suggestions, 
                  macro calculations), your inputs are processed through OpenRouter's API. 
                  These requests are anonymous and not linked to any user identity.
                </p>
              </div>
            </section>

            {/* Data Storage */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-accent" />
                How We Store Your Data
              </h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>Calculator results and preferences: Stored in your browser's local storage</li>
                <li>PWA data: Cached locally on your device for offline access</li>
                <li>No server-side user accounts or profiles</li>
                <li>No tracking cookies or advertising identifiers</li>
              </ul>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Third-Party Services
              </h2>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  <strong>OpenRouter API:</strong> Used for AI features. OpenRouter processes 
                  requests according to their privacy policy. No personal data is included 
                  in these requests.
                </p>
                <p className="leading-relaxed">
                  <strong>Vercel:</strong> Our hosting provider. They may collect standard 
                  server logs (IP addresses, request times) for security and performance monitoring.
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Cookie className="w-5 h-5 text-accent" />
                Cookies
              </h2>
              <p className="leading-relaxed">
                We use minimal, essential cookies only for:
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Remembering your theme preference (light/dark mode)</li>
                <li>Maintaining your calculator settings during your session</li>
              </ul>
              <p className="mt-2 leading-relaxed">
                We do not use tracking, advertising, or analytics cookies.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Your Rights
              </h2>
              <p className="leading-relaxed mb-3">
                Since all personal data is stored locally on your device, you have complete control:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Clear your browser's local storage to remove all saved data</li>
                <li>Use your browser's privacy mode for temporary sessions</li>
                <li>Disable JavaScript to prevent any local data storage</li>
              </ul>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Policy Updates
              </h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. Any changes will be 
                posted on this page with an updated revision date.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-accent" />
                Contact Us
              </h2>
              <p className="leading-relaxed">
                If you have questions about this Privacy Policy or our practices, please 
                contact us through the form on our website.
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