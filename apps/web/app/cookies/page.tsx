import type { Metadata } from 'next';

import { canonical } from '../../lib/site';

export const metadata: Metadata = {
  title: 'Cookie Notice',
  description: 'Cookie and browser storage behavior for FairPay.',
  alternates: { canonical: canonical.cookies },
};

export default function CookiesPage() {
  return (
    <main className="shell legal-shell">
      <section className="panel legal-panel">
        <h1>Cookie Notice</h1>
        <p>
          FairPay uses browser localStorage to save salary timeline preferences on your device. This storage
          is local to your browser and can be cleared at any time.
        </p>
        <p>
          Cloudflare Web Analytics is cookieless. If AdSense is enabled in future releases, Google may set
          cookies according to its policy.
        </p>
      </section>
    </main>
  );
}
