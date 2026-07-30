'use client';

import { useEffect, useId, useRef, useState } from 'react';

import type { CpiSeries } from '@fairpay/schema';

import { ChartSkeleton } from './chart-skeleton';

type Props = {
  series: CpiSeries;
  /** Show last N years. Default 5. */
  years?: number;
};

type Cell = {
  year: number;
  month: number;   // 1-12
  mom: number | null;
};

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildCells(series: CpiSeries, years: number): Cell[] {
  const pts = series.points;
  const cutoffYear = new Date().getFullYear() - years + 1;
  const cells: Cell[] = [];
  for (let i = 1; i < pts.length; i++) {
    const cur = pts[i]!;
    const prev = pts[i - 1]!;
    const year = parseInt(cur.date.slice(0, 4), 10);
    if (year < cutoffYear) continue;
    const month = parseInt(cur.date.slice(5, 7), 10);
    const mom = prev.value > 0 ? (cur.value - prev.value) / prev.value : null;
    cells.push({ year, month, mom });
  }
  return cells;
}

function momToColor(mom: number | null): string {
  if (mom === null) return 'var(--surface-muted)';
  // Scale: 0% = neutral, +1% = strong red, -0.5% = strong green
  const clamped = Math.max(-0.01, Math.min(0.015, mom));
  if (clamped >= 0) {
    const intensity = Math.round((clamped / 0.015) * 255);
    return `rgb(${intensity}, ${Math.max(0, 80 - intensity)}, ${Math.max(0, 80 - intensity)})`;
  } else {
    const intensity = Math.round((-clamped / 0.01) * 200);
    return `rgb(0, ${intensity}, ${Math.round(intensity * 0.6)})`;
  }
}

export function InflationHeatmap({ series, years = 5 }: Props) {
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const captionId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <ChartSkeleton height={160} />;

  const cells = buildCells(series, years);
  const yearSet = [...new Set(cells.map(c => c.year))].sort((a, b) => a - b);

  // Build grid: [year][month] = mom
  const grid = new Map<number, Map<number, number | null>>();
  for (const c of cells) {
    if (!grid.has(c.year)) grid.set(c.year, new Map());
    grid.get(c.year)!.set(c.month, c.mom);
  }

  const cellSize = 14;
  const gap = 2;

  return (
    <figure className="chart-figure" role="img" aria-labelledby={captionId} ref={containerRef}>
      <figcaption id={captionId} className="chart-caption">
        Month-over-month CPI change heatmap for {series.label} over the last {years} years.
        Red cells indicate inflation spikes; green cells indicate deflation.
      </figcaption>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'inline-grid', gridTemplateColumns: `32px repeat(${yearSet.length}, ${cellSize}px)`, gap: `${gap}px`, alignItems: 'center' }}>
          {/* Header row: years */}
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }} />
          {yearSet.map(y => (
            <div key={y} style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', writingMode: 'vertical-rl', height: 28 }}>
              {y}
            </div>
          ))}

          {/* Data rows: months */}
          {MONTH_ABBR.map((abbr, mi) => (
            <>
              <div key={`lbl-${mi}`} style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'right', paddingRight: 4 }}>
                {abbr}
              </div>
              {yearSet.map(y => {
                const mom = grid.get(y)?.get(mi + 1) ?? null;
                const pctStr = mom !== null ? `${mom >= 0 ? '+' : ''}${(mom * 100).toFixed(2)}%` : 'N/A';
                return (
                  <div
                    key={`${y}-${mi}`}
                    className="heatmap-cell"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: momToColor(mom),
                      opacity: 0.85,
                    }}
                    title={`${abbr} ${y}: ${pctStr}`}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      const cr = containerRef.current?.getBoundingClientRect();
                      setTooltip({
                        text: `${abbr} ${y}: ${pctStr}`,
                        x: rect.left - (cr?.left ?? 0),
                        y: rect.top - (cr?.top ?? 0) - 28,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    aria-label={`${abbr} ${y}: ${pctStr}`}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>

      {tooltip ? (
        <div style={{
          position: 'absolute',
          left: tooltip.x,
          top: tooltip.y,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '3px 7px',
          fontSize: 11,
          pointerEvents: 'none',
          zIndex: 10,
          whiteSpace: 'nowrap',
          color: 'var(--text)',
          boxShadow: '0 2px 8px rgb(0 0 0 / 12%)',
        }}>
          {tooltip.text}
        </div>
      ) : null}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 9, color: 'var(--text-muted)' }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgb(0,200,120)' }} /> Deflation
        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--surface-muted)', border: '1px solid var(--border)' }} /> Neutral
        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgb(255,30,30)' }} /> Spike
      </div>
    </figure>
  );
}
