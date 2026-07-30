import type { Metadata } from 'next';

import { canonical } from '../../lib/site';
import { config } from '../../lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How FairPay handles data and why salary entries stay in your browser.',
  alternates: { canonical: canonical.privacy },
};

export default function PrivacyPage() {
  return (
    <main className="shell legal-shell">
      <section className="panel legal-panel">
        <h1>Privacy Policy</h1>
        <p>
          Salary timeline entries are stored in your browser localStorage only. FairPay does not transmit
          salary amounts to any backend service.
        </p>
        <p>
          We may load infrastructure scripts configured in site settings, such as cookieless analytics and,
          when enabled, ad scripts. Those services operate under their own policies.
        </p>
        <p>
          Contact: {config.site.contactEmail}.
        </p>
      </section>
    </main>
  );
}
