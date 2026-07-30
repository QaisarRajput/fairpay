import type { Metadata } from 'next';

import { canonical } from '../../lib/site';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms governing use of the FairPay calculator and content.',
  alternates: { canonical: canonical.terms },
};

export default function TermsPage() {
  return (
    <main className="shell legal-shell">
      <section className="panel legal-panel">
        <h1>Terms of Use</h1>
        <p>
          FairPay is provided for informational use only. You are responsible for decisions based on these
          calculations.
        </p>
        <p>
          Inflation-adjusted outputs depend on public CPI series and your provided inputs. We do not warrant
          fitness for any specific legal, tax, or contractual purpose.
        </p>
        <p>By using this site, you agree to these terms.</p>
      </section>
    </main>
  );
}
