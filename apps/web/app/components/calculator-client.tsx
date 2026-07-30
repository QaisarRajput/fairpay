'use client';

import {
  breakEven,
  categoryDivergence,
  realPct,
  realValue,
  type CategoryDivergenceRow,
} from '@fairpay/calc';
import type { CpiIndex, CpiSeries } from '@fairpay/schema';
import { useEffect, useMemo, useRef, useState } from 'react';

import { CategoryBarsChart } from './charts/category-bars-chart';
import { CpiTrendChart } from './charts/cpi-trend-chart';
import { OfferChart } from './charts/offer-chart';
import { PurchasingPowerGauge } from './charts/purchasing-power-gauge';
import { SalaryVsInflationChart } from './charts/salary-vs-inflation-chart';

type SalaryRow = {
  id: string;
  periodMonth: string;
  amount: string;
};

type OfferRow = {
  id: string;
  label: string;
  amount: string;
};

type ParsedSalaryRow = {
  periodMonth: string;
  amount: number;
};

type CalculationResult = {
  from: ParsedSalaryRow;
  to: ParsedSalaryRow;
  breakEvenAmount: number;
  realValueAmount: number;
  realChangePct: number;
  selectedSeries: CpiSeries;
  worstCategory: CategoryDivergenceRow;
  allDivergenceRows: CategoryDivergenceRow[];
};

type PersistedState = {
  rows: SalaryRow[];
  seriesId: string;
  offers: OfferRow[];
};

const STORAGE_KEY = 'fairpay.calculator.v1';
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function createRow(periodMonth = '', amount = ''): SalaryRow {
  return {
    id: createId(),
    periodMonth,
    amount,
  };
}

function createOffer(label: string): OfferRow {
  return {
    id: createId(),
    label,
    amount: '',
  };
}

function parsePositiveAmount(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return numeric;
}

function parseSalaryRows(rows: SalaryRow[]): ParsedSalaryRow[] {
  return rows
    .map((row) => {
      if (!MONTH_PATTERN.test(row.periodMonth)) {
        return null;
      }

      const amount = parsePositiveAmount(row.amount);
      if (amount === null) {
        return null;
      }

      return {
        periodMonth: row.periodMonth,
        amount,
      };
    })
    .filter((row): row is ParsedSalaryRow => row !== null);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function toCoverageMonth(date: string): string {
  return date.slice(0, 7);
}

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as PersistedState;
  return Array.isArray(candidate.rows) && Array.isArray(candidate.offers) && typeof candidate.seriesId === 'string';
}

export function CalculatorClient() {
  const [rows, setRows] = useState<SalaryRow[]>([createRow('2021-06', '80000'), createRow('2024-06', '88000')]);
  const [seriesId, setSeriesId] = useState('CPIAUCSL');
  const [offers, setOffers] = useState<OfferRow[]>([createOffer('Offer A'), createOffer('Offer B'), createOffer('Offer C')]);

  const [indexData, setIndexData] = useState<CpiIndex | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [message, setMessage] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [displayValues, setDisplayValues] = useState<{ breakEven: number; realValue: number } | null>(null);

  const didHydrateFromStorage = useRef(false);
  const seriesCacheRef = useRef<Map<string, CpiSeries>>(new Map());

  async function loadSeries(seriesIdentifier: string): Promise<CpiSeries> {
    const fromCache = seriesCacheRef.current.get(seriesIdentifier);
    if (fromCache) {
      return fromCache;
    }

    const response = await fetch(`/data/cpi/${seriesIdentifier}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${seriesIdentifier}.`);
    }

    const series = (await response.json()) as CpiSeries;
    seriesCacheRef.current.set(seriesIdentifier, series);
    return series;
  }

  useEffect(() => {
    let active = true;

    async function run(): Promise<void> {
      try {
        const response = await fetch('/data/cpi/index.json');
        if (!response.ok) {
          throw new Error('Unable to load CPI index.');
        }

        const payload = (await response.json()) as CpiIndex;
        if (!active) {
          return;
        }

        setIndexData(payload);
      } catch (error) {
        if (!active) {
          return;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unable to load CPI index.';
        setMessage(errorMessage);
      } finally {
        if (active) {
          setLoadingIndex(false);
        }
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    const to = params.get('to');
    const fromPay = params.get('fromPay');
    const toPay = params.get('toPay');
    const querySeriesId = params.get('series');

    const hasQueryResult = Boolean(from && to && fromPay && toPay);

    if (hasQueryResult) {
      setRows([createRow(from ?? '', fromPay ?? ''), createRow(to ?? '', toPay ?? '')]);
      if (querySeriesId) {
        setSeriesId(querySeriesId);
      }
      didHydrateFromStorage.current = true;
      return;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      didHydrateFromStorage.current = true;
      return;
    }

    try {
      const parsed = JSON.parse(saved) as unknown;
      if (!isPersistedState(parsed)) {
        didHydrateFromStorage.current = true;
        return;
      }

      if (parsed.rows.length >= 2) {
        setRows(parsed.rows);
      }
      if (parsed.seriesId) {
        setSeriesId(parsed.seriesId);
      }
      if (parsed.offers.length > 0) {
        setOffers(parsed.offers);
      }
    } catch {
      // Ignore malformed local state.
    } finally {
      didHydrateFromStorage.current = true;
    }
  }, []);

  useEffect(() => {
    if (!didHydrateFromStorage.current || typeof window === 'undefined') {
      return;
    }

    const payload: PersistedState = {
      rows,
      seriesId,
      offers,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [offers, rows, seriesId]);

  useEffect(() => {
    if (!indexData) {
      return;
    }

    const currentIndex = indexData;
    let active = true;

    async function compute(): Promise<void> {
      const parsedRows = parseSalaryRows(rows);
      if (parsedRows.length < 2) {
        if (active) {
          setResult(null);
          setDisplayValues(null);
          setMessage('Enter at least two valid salary rows to calculate your real raise.');
        }
        return;
      }

      const sortedRows = [...parsedRows].sort((left, right) => left.periodMonth.localeCompare(right.periodMonth));
      const fromRow = sortedRows[0];
      const toRow = sortedRows[sortedRows.length - 1];

      if (!fromRow || !toRow) {
        return;
      }

      const coverageStart = toCoverageMonth(currentIndex.coverageStart);
      const coverageEnd = toCoverageMonth(currentIndex.coverageEnd);
      if (fromRow.periodMonth < coverageStart || toRow.periodMonth > coverageEnd) {
        if (active) {
          setResult(null);
          setDisplayValues(null);
          setMessage(
            `Pick dates between ${coverageStart} and ${coverageEnd}. CPI lookups use the nearest available month at or before each date.`,
          );
        }
        return;
      }

      if (!currentIndex.series.some((meta) => meta.seriesId === seriesId)) {
        if (active) {
          setResult(null);
          setDisplayValues(null);
          setMessage('Select a CPI series from the available list.');
        }
        return;
      }

      try {
        const selectedSeries = await loadSeries(seriesId);
        const allSeries = await Promise.all(currentIndex.series.map((meta) => loadSeries(meta.seriesId)));

        const breakEvenAmount = breakEven(fromRow.amount, fromRow.periodMonth, toRow.periodMonth, selectedSeries.points);
        const realValueAmount = realValue(toRow.amount, fromRow.periodMonth, toRow.periodMonth, selectedSeries.points);
        const realChangePct = realPct(
          fromRow.amount,
          toRow.amount,
          fromRow.periodMonth,
          toRow.periodMonth,
          selectedSeries.points,
        );

        const divergence = categoryDivergence({
          salaryFrom: fromRow.amount,
          salaryTo: toRow.amount,
          fromDate: fromRow.periodMonth,
          toDate: toRow.periodMonth,
          series: allSeries,
        });

        if (!active) {
          return;
        }

        const nextResult: CalculationResult = {
          from: fromRow,
          to: toRow,
          breakEvenAmount,
          realValueAmount,
          realChangePct,
          selectedSeries,
          worstCategory: divergence.worst,
          allDivergenceRows: divergence.rows,
        };

        setResult(nextResult);
        setMessage('');

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams();
          params.set('from', fromRow.periodMonth);
          params.set('to', toRow.periodMonth);
          params.set('fromPay', fromRow.amount.toFixed(0));
          params.set('toPay', toRow.amount.toFixed(0));
          params.set('series', seriesId);
          window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unable to compute result.';
        setResult(null);
        setDisplayValues(null);
        setMessage(errorMessage);
      }
    }

    void compute();

    return () => {
      active = false;
    };
  }, [indexData, rows, seriesId]);

  useEffect(() => {
    if (!result) {
      return;
    }

    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      setDisplayValues({
        breakEven: result.breakEvenAmount,
        realValue: result.realValueAmount,
      });
      return;
    }

    const start = performance.now();
    const durationMs = 550;
    const fromBreakEven = displayValues?.breakEven ?? 0;
    const fromRealValue = displayValues?.realValue ?? 0;
    const toBreakEven = result.breakEvenAmount;
    const toRealValue = result.realValueAmount;

    let rafId = 0;

    const step = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValues({
        breakEven: fromBreakEven + (toBreakEven - fromBreakEven) * eased,
        realValue: fromRealValue + (toRealValue - fromRealValue) * eased,
      });

      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [result]);

  const offerRanking = useMemo(() => {
    if (!result) {
      return [] as Array<{ id: string; label: string; amount: number; realPct: number }>;
    }

    const rowsWithValues = offers
      .map((offer) => {
        const amount = parsePositiveAmount(offer.amount);
        if (amount === null) {
          return null;
        }

        return {
          id: offer.id,
          label: offer.label,
          amount,
          realPct: realPct(
            result.from.amount,
            amount,
            result.from.periodMonth,
            result.to.periodMonth,
            result.selectedSeries.points,
          ),
        };
      })
      .filter((entry): entry is { id: string; label: string; amount: number; realPct: number } => entry !== null)
      .sort((left, right) => right.realPct - left.realPct);

    return rowsWithValues;
  }, [offers, result]);

  async function onShare(): Promise<void> {
    if (!result || typeof window === 'undefined') {
      return;
    }

    const url = window.location.href;
    const title = 'Did You Actually Get a Raise?';
    const text = `Real change: ${formatPercent(result.realChangePct)} using ${result.selectedSeries.label}`;

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({
          title,
          text,
          url,
        });
        setShareMessage('Result shared.');
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareMessage('Share link copied to clipboard.');
    } catch {
      setShareMessage('Sharing was canceled or unavailable on this device.');
    }
  }

  function updateRow(id: string, field: 'periodMonth' | 'amount', value: string): void {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  function removeRow(id: string): void {
    setRows((current) => (current.length <= 2 ? current : current.filter((row) => row.id !== id)));
  }

  return (
    <section className="calculator-grid" aria-live="polite" id="calculator">
      <article className="panel">
        <h2>Salary timeline</h2>
        <p className="subtle">
          Add pay checkpoints over time. FairPay compares your earliest and latest valid entries against one CPI series.
        </p>

        <div className="privacy-pill">Stored on your device only. Salary values are never sent anywhere.</div>

        <div className="rows">
          {rows.map((row) => (
            <div className="row" key={row.id}>
              <label>
                Month
                <input
                  type="month"
                  value={row.periodMonth}
                  onChange={(event) => updateRow(row.id, 'periodMonth', event.target.value)}
                />
              </label>
              <label>
                Salary (USD)
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={row.amount}
                  onChange={(event) => updateRow(row.id, 'amount', event.target.value)}
                  placeholder="80000"
                />
              </label>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={rows.length <= 2}
                aria-label={`Remove salary row ${row.periodMonth || row.id}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="ghost" onClick={() => setRows((current) => [...current, createRow()])}>
          Add salary row
        </button>

        <label>
          CPI series
          <select value={seriesId} onChange={(event) => setSeriesId(event.target.value)} disabled={loadingIndex}>
            {(indexData?.series ?? []).map((meta) => (
              <option key={meta.seriesId} value={meta.seriesId}>
                {meta.label}
              </option>
            ))}
          </select>
        </label>

        <p className="subtle">
          Boundary rule: dates must stay within CPI coverage. Lookup uses the nearest month at or before your chosen date.
        </p>
      </article>

      <article className="panel result-panel">
        <h2>Reality check</h2>
        {message ? (
          <p className="status-message" role="status" aria-live="polite">
            {message}
          </p>
        ) : null}

        {result ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <PurchasingPowerGauge realPct={result.realChangePct} size={160} />
            </div>

            <div className="stats-row">
              <div className="stat-cell">
                <span>Break-even salary</span>
                <strong>{formatCurrency(displayValues?.breakEven ?? result.breakEvenAmount)}</strong>
              </div>
              <div className="stat-cell">
                <span>Real value of pay</span>
                <strong>{formatCurrency(displayValues?.realValue ?? result.realValueAmount)}</strong>
              </div>
              <div className="stat-cell">
                <span>Real change</span>
                <strong>
                  <span className={result.realChangePct >= 0 ? 'badge badge-gain' : 'badge badge-loss'}>
                    {formatPercent(result.realChangePct)}
                  </span>
                </strong>
              </div>
            </div>

            <div className="chart-section">
              <p className="chart-section-title">Salary vs. Inflation</p>
              <SalaryVsInflationChart
                series={result.selectedSeries}
                fromDate={result.from.periodMonth}
                toDate={result.to.periodMonth}
                salaryFrom={result.from.amount}
                salaryTo={result.to.amount}
              />
            </div>

            <p className="subtle" style={{ marginTop: '0.75rem' }}>
              Toughest category: <strong>{result.worstCategory.label}</strong> at{' '}
              <span className={result.worstCategory.realPct < 0 ? 'loss' : 'gain'}>
                {formatPercent(result.worstCategory.realPct)}
              </span>{' '}real change.
            </p>

            <div className="actions" style={{ marginTop: '0.75rem' }}>
              <button type="button" onClick={() => void onShare()}>
                Share result
              </button>
              {shareMessage ? (
                <span className="subtle" role="status" aria-live="polite">
                  {shareMessage}
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <svg className="empty-state-icon" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <rect x="8" y="40" width="10" height="16" rx="3" fill="var(--border)" />
              <rect x="22" y="28" width="10" height="28" rx="3" fill="var(--border)" />
              <rect x="36" y="32" width="10" height="24" rx="3" fill="var(--border)" />
              <rect x="50" y="20" width="10" height="36" rx="3" fill="var(--accent)" opacity="0.35" />
              <path d="M12 30 22 22 36 26 52 14" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            </svg>
            <p style={{ fontSize: 'var(--t-sm)' }}>Enter your salary history to see your results here.</p>
          </div>
        )}
      </article>

      <article className="panel comparison-panel">
        <h2>Offer comparison</h2>
        <p className="subtle">Compare up to three offers in real terms against your earliest timeline row.</p>

        <div className="offer-grid">
          {offers.map((offer) => (
            <label key={offer.id}>
              {offer.label}
              <input
                type="number"
                min="1"
                step="100"
                value={offer.amount}
                onChange={(event) =>
                  setOffers((current) =>
                    current.map((entry) =>
                      entry.id === offer.id ? { ...entry, amount: event.target.value } : entry,
                    ),
                  )
                }
                placeholder="90000"
              />
            </label>
          ))}
        </div>

        {offerRanking.length > 0 ? (
          <>
            <OfferChart
              offers={offerRanking}
              currentRealValue={result?.from.amount ?? 0}
              salaryFromLabel={result?.from.periodMonth ?? ''}
            />
            <ol className="ranking" style={{ marginTop: '0.75rem' }} aria-label="Offer ranking">
              {offerRanking.map((offer) => (
                <li key={offer.id}>
                  <span>{offer.label}</span>
                  <span>{formatCurrency(offer.amount)}</span>
                  <span className={offer.realPct >= 0 ? 'gain' : 'loss'}>{formatPercent(offer.realPct)}</span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="subtle">Add one or more offer salaries to rank them by inflation-adjusted outcome.</p>
        )}
      </article>

      {result ? (
        <article className="panel animate-enter">
          <h2>Where inflation hit hardest</h2>
          <p className="subtle">All 9 spending categories ranked by real impact on your salary.</p>
          <div style={{ marginTop: '0.75rem' }}>
            <CategoryBarsChart
              rows={result.allDivergenceRows}
              overallRealPct={result.realChangePct}
            />
          </div>
        </article>
      ) : null}

      {result ? (
        <article className="panel">
          <details className="collapsible-section">
            <summary>
              CPI history — {result.selectedSeries.label}
              <svg className="collapsible-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <CpiTrendChart
              series={result.selectedSeries}
              fromDate={result.from.periodMonth}
              toDate={result.to.periodMonth}
            />
          </details>
        </article>
      ) : null}
    </section>
  );
}
