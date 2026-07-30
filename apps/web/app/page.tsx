import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { realValue } from '@fairpay/calc';
import { CpiSeries } from '@fairpay/schema';

import { CalculatorClient } from './components/calculator-client';
import { TipButton } from './components/tip-button';
import { AdSlot } from './components/ad-slot';
import { readCpiIndex } from '../lib/cpi-index';
import { config, externalUrls } from '../lib/site';

export default async function HomePage() {
  const cpiIndex = await readCpiIndex();
  const lastSyncedAt = cpiIndex ? new Date(cpiIndex.lastSyncedAt).toLocaleDateString('en-US') : 'Unknown';

  // Build-time hero persuasion stat: what is $80k from Jan 2020 worth today?
  let heroStatReal: number | null = null;
  let heroStatToDate = '';
  try {
    const seriesPath = resolve(process.cwd(), 'public', 'data', 'cpi', 'CPIAUCSL.json');
    const rawSeries = CpiSeries.parse(JSON.parse(await readFile(seriesPath, 'utf8')));
    const latestPt = rawSeries.points[rawSeries.points.length - 1];
    if (latestPt) {
      heroStatToDate = latestPt.date.slice(0, 7);
      heroStatReal = Math.round(realValue(80_000, '2020-01', heroStatToDate, rawSeries.points));
    }
  } catch {
    // Non-fatal: hero stat falls back gracefully
  }

  const faqItems = [
    {
      question: 'Is my salary data sent anywhere?',
      answer: 'No. Salary history is stored in your browser localStorage only.',
    },
    {
      question: 'Where does inflation data come from?',
      answer: 'From the Federal Reserve Economic Data (FRED) CPI-U monthly index series.',
    },
    {
      question: 'Why does category inflation differ from headline CPI?',
      answer:
        'Spending categories move differently. Transportation, energy, or medical costs can outrun headline inflation at different times.',
    },
    {
      question: 'How current is the dataset?',
      answer: `Latest CPI sync: ${lastSyncedAt}.`,
    },
  ];

  const faqJsonLd = {
    '@context': externalUrls.schemaOrg,
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  const appJsonLd = {
    '@context': externalUrls.schemaOrg,
    '@type': 'WebApplication',
    name: config.site.name,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    url: config.site.url,
    description: 'Inflation-adjusted wage calculator with category comparison.',
  };

  return (
    <main className="shell">
      <section className="hero panel">
        {heroStatReal !== null ? (
          <div className="hero-stat">
            <span>Since Jan 2020, $80k has the real buying power of</span>
            <strong>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(heroStatReal)}
            </strong>
            <span>today</span>
          </div>
        ) : (
          <p className="eyebrow">FairPay</p>
        )}
        <h1>Did You Actually Get a Raise?</h1>
        <p>
          Your paycheck can grow while your buying power shrinks. FairPay converts salary changes into
          inflation-adjusted reality, with category-level pressure points and shareable result links.
        </p>
        <div className="hero-actions">
          <a href="#calculator" className="tip-link" style={{ textDecoration: 'none' }}>
            Check My Raise →
          </a>
          <TipButton />
        </div>
      </section>

      <section id="compare">
        <CalculatorClient />
      </section>

      <section className="panel faq" id="faq">
        <h2>FAQ</h2>
        <details>
          <summary>Is my salary data sent anywhere?</summary>
          <p>No. Salary history is stored in your browser localStorage only.</p>
        </details>
        <details>
          <summary>Where does inflation data come from?</summary>
          <p>From the Federal Reserve Economic Data (FRED) CPI-U monthly index series.</p>
        </details>
        <details>
          <summary>Why does category inflation differ from headline CPI?</summary>
          <p>
            Spending categories move differently. Transportation, energy, or medical costs can outrun
            headline inflation at different times.
          </p>
        </details>
        <details>
          <summary>How current is the dataset?</summary>
          <p>Latest CPI sync: {lastSyncedAt}.</p>
        </details>
      </section>

      <AdSlot slot="0000000000" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </main>
  );
}
