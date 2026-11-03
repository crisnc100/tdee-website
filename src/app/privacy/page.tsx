import type { Metadata } from 'next';
import { BackLink, DashList, DocSection, DocSheet } from '@/components/ui/lab';

export const metadata: Metadata = {
  title: 'Privacy Policy | TDEE Calculator',
};

export default function PrivacyPolicy() {
  return (
    <DocSheet label="Privacy" title="Privacy Policy" updated="Last updated: November 2026">
      <DocSection index={1} title="Summary">
        <p>
          This calculator does not collect personal data. There are no accounts, no
          analytics and no tracking. Everything you enter stays in your browser.
        </p>
      </DocSection>

      <DocSection index={2} title="What is stored, and where">
        <p>
          To remember your inputs between visits, the site saves them in your
          browser&apos;s local storage on your own device:
        </p>
        <DashList
          items={[
            'The values you enter in the calculator',
            'Your most recent result and when you calculated it',
            'Your daily log of weigh-ins and calories, if you keep one',
            'Your light or dark theme choice',
          ]}
        />
        <p>
          This data is never sent to a server. The calculation runs entirely in your browser.
        </p>
      </DocSection>

      <DocSection index={3} title="Your control">
        <DashList
          items={[
            <>Clear this site&apos;s data in your browser settings to delete everything it saved</>,
            'Export your daily log from the Track tab to keep a copy; importing a file reads it on your device and uploads nothing',
            'Use a private or incognito window if you do not want anything saved',
          ]}
        />
      </DocSection>

      <DocSection index={4} title="Hosting">
        <p>
          Like any website, the server that delivers these pages may keep standard request
          logs (such as IP address and time of request) for security and reliability. The
          site itself adds no cookies, analytics or third-party trackers.
        </p>
      </DocSection>

      <DocSection index={5} title="Changes">
        <p>
          If this policy changes, the updated version will be posted on this page with a new date.
        </p>
      </DocSection>

      <BackLink href="/">← Back to Calculator</BackLink>
    </DocSheet>
  );
}
