import type { Metadata } from 'next';

import { canonical } from '../../lib/site';

export const metadata: Metadata = {
  title: 'About FairPay',
  description: 'What FairPay does, why it exists, and what it does not try to do.',
  alternates: { canonical: canonical.about },
};

export default function AboutPage() {
  return (
    <main className="shell legal-shell">
      <section className="panel legal-panel">
        <h1>About FairPay</h1>
        <p>
          FairPay gives you a direct inflation-adjusted answer to one question: did your raise improve your
          real buying power?
        </p>
        <p>
          We use publicly available CPI-U series from FRED, and we keep this tool intentionally focused:
          wage-vs-inflation decisions in plain numbers you can share.
        </p>
        <p>
          FairPay does not provide tax advice, investment advice, or city-specific cost-of-living forecasts.
        </p>
      </section>
    </main>
  );
}
