import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Database, Lock, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | TDEE Calculator',
};

export default function PrivacyPolicy() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          </div>

          <p className="text-muted-foreground mb-8">Last updated: November 2026</p>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-accent" />
                Summary
              </h2>
              <p className="leading-relaxed">
                This calculator does not collect personal data. There are no accounts, no
                analytics and no tracking. Everything you enter stays in your browser.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-accent" />
                What is stored, and where
              </h2>
              <p className="leading-relaxed mb-3">
                To remember your inputs between visits, the site saves them in your
                browser&apos;s local storage on your own device:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>The values you enter in the calculator</li>
                <li>Your most recent result and when you calculated it</li>
                <li>Your light or dark theme choice</li>
              </ul>
              <p className="leading-relaxed mt-3">
                This data is never sent to a server. The calculation runs entirely in your browser.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-accent" />
                Your control
              </h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>Clear this site&apos;s data in your browser settings to delete everything it saved</li>
                <li>Use a private or incognito window if you do not want anything saved</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Hosting</h2>
              <p className="leading-relaxed">
                Like any website, the server that delivers these pages may keep standard request
                logs (such as IP address and time of request) for security and reliability. The
                site itself adds no cookies, analytics or third-party trackers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Changes</h2>
              <p className="leading-relaxed">
                If this policy changes, the updated version will be posted on this page with a new date.
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
