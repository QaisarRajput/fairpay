'use client';

import { useEffect, useState } from 'react';

import type { CpiIndex, CpiSeries } from '@fairpay/schema';

import { CpiTrendChart } from '../components/charts/cpi-trend-chart';
import { InflationHeatmap } from '../components/charts/inflation-heatmap';
import { ChartSkeleton } from '../components/charts/chart-skeleton';

const SERIES_IDS = [
  'CPIAUCSL', 'CPIUFDSL', 'CPIHOSSL', 'CPITRNSL',
  'CPIMEDSL', 'CPIAPPSL', 'CPIRECSL', 'CPIEDUSL', 'CPIENGSL',
];

const SERIES_LABELS: Record<string, string> = {
  CPIAUCSL: 'All items',
  CPIUFDSL: 'Food',
  CPIHOSSL: 'Housing',
  CPITRNSL: 'Transportation',
  CPIMEDSL: 'Medical care',
  CPIAPPSL: 'Apparel',
  CPIRECSL: 'Recreation',
  CPIEDUSL: 'Education',
  CPIENGSL: 'Energy',
};

type ExplorerView = 'chart' | 'heatmap';

export default function InflationExplorer() {
  const [indexData, setIndexData] = useState<CpiIndex | null>(null);
  const [selectedId, setSelectedId] = useState('CPIAUCSL');
  const [seriesCache, setSeriesCache] = useState<Map<string, CpiSeries>>(new Map());
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ExplorerView>('chart');

  useEffect(() => {
    fetch('/data/cpi/index.json')
      .then(r => r.json())
      .then((d: CpiIndex) => setIndexData(d))
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (seriesCache.has(selectedId)) return;
    setLoading(true);
    fetch(`/data/cpi/${selectedId}.json`)
      .then(r => r.json())
      .then((s: CpiSeries) => {
        setSeriesCache(prev => new Map(prev).set(selectedId, s));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedId, seriesCache]);

  const series = seriesCache.get(selectedId);
  const meta = indexData?.series.find(s => s.seriesId === selectedId);

  // Compute stats from series
  const stats = series ? computeStats(series) : null;

  const getLabel = (id: string) => indexData?.series.find(s => s.seriesId === id)?.label ?? SERIES_LABELS[id] ?? id;

  return (
    <main className="explorer-shell">
      <div className="hero" style={{ padding: 0 }}>
        <p className="eyebrow">Inflation Explorer</p>
        <h1 style={{ fontSize: 'var(--t-xl)' }}>US CPI — All Categories Since 1947</h1>
        <p className="subtle">
          Browse the full inflation history for all 9 CPI spending categories.
          Data sourced from{' '}
          <a href="https://fred.stlouisfed.org/" rel="noopener noreferrer" target="_blank" className="inline-link">
            FRED
          </a>.
        </p>
      </div>

      <div>
        <div className="explorer-tabs">
          {SERIES_IDS.map(id => (
            <button
              key={id}
              type="button"
              className={`tab-btn${id === selectedId ? ' active' : ''}`}
              onClick={() => setSelectedId(id)}
            >
              {getLabel(id)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
          <button
            type="button"
            className={`tab-btn${view === 'chart' ? ' active' : ''}`}
            onClick={() => setView('chart')}
            style={{ fontSize: 'var(--t-xs)' }}
          >
            Line chart
          </button>
          <button
            type="button"
            className={`tab-btn${view === 'heatmap' ? ' active' : ''}`}
            onClick={() => setView('heatmap')}
            style={{ fontSize: 'var(--t-xs)' }}
          >
            MoM heatmap
          </button>
        </div>

        <div className="panel">
          <h2 style={{ marginBottom: '0.75rem' }}>{meta?.label ?? SERIES_LABELS[selectedId] ?? selectedId}</h2>
          {loading || !series ? (
            <ChartSkeleton height={view === 'chart' ? 280 : 200} />
          ) : view === 'chart' ? (
            <CpiTrendChart series={series} />
          ) : (
            <InflationHeatmap series={series} years={10} />
          )}
        </div>
      </div>

      {stats ? (
        <div className="explorer-stats">
          <div className="explorer-stat">
            <div className="explorer-stat-label">Cumulative since {stats.firstYear}</div>
            <div className="explorer-stat-value">{stats.cumulative}</div>
          </div>
          <div className="explorer-stat">
            <div className="explorer-stat-label">Highest MoM spike</div>
            <div className="explorer-stat-value" style={{ color: 'var(--loss)' }}>{stats.worstMonth}</div>
            <div style={{ fontSize: 'var(--t-xs)', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{stats.worstMonthLabel}</div>
          </div>
          <div className="explorer-stat">
            <div className="explorer-stat-label">Last 12 months</div>
            <div className="explorer-stat-value">{stats.last12}</div>
          </div>
          <div className="explorer-stat">
            <div className="explorer-stat-label">5-year change</div>
            <div className="explorer-stat-value">{stats.fiveYear}</div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

type Stats = {
  cumulative: string;
  firstYear: number;
  worstMonth: string;
  worstMonthLabel: string;
  last12: string;
  fiveYear: string;
};

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
}

function computeStats(series: CpiSeries): Stats {
  const pts = series.points;
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (!first || !last) return { cumulative: 'N/A', firstYear: 0, worstMonth: 'N/A', worstMonthLabel: '', last12: 'N/A', fiveYear: 'N/A' };

  const cumulative = fmtPct((last.value - first.value) / first.value);
  const firstYear = parseInt(first.date.slice(0, 4), 10);

  let worstMom = 0;
  let worstMonthLabel = '';
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!;
    const cur = pts[i]!;
    if (prev.value > 0) {
      const mom = (cur.value - prev.value) / prev.value;
      if (mom > worstMom) { worstMom = mom; worstMonthLabel = cur.date.slice(0, 7); }
    }
  }

  const worstMonth = fmtPct(worstMom);

  const last12Idx = pts.length - 13;
  const last12 = last12Idx >= 0 ? fmtPct((last.value - pts[last12Idx]!.value) / pts[last12Idx]!.value) : 'N/A';

  const fiveYearIdx = pts.length - 61;
  const fiveYear = fiveYearIdx >= 0 ? fmtPct((last.value - pts[fiveYearIdx]!.value) / pts[fiveYearIdx]!.value) : 'N/A';

  return { cumulative, firstYear, worstMonth, worstMonthLabel, last12, fiveYear };
}
