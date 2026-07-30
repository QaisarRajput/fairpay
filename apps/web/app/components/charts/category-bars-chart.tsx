'use client';

import { useEffect, useId, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { CategoryDivergenceRow } from '@fairpay/calc';

import { ChartSkeleton } from './chart-skeleton';

type Props = {
  rows: CategoryDivergenceRow[];
  overallRealPct: number;
};

type BarEntry = {
  label: string;
  pct: number;
  pctDisplay: string;
};

function formatPct(v: number) {
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value ?? 0;
  return (
    <div className="recharts-default-tooltip">
      <p className="recharts-tooltip-label">{label}</p>
      <p className="recharts-tooltip-item">Real change: <strong style={{ color: v >= 0 ? 'var(--gain)' : 'var(--loss)' }}>{formatPct(v)}</strong></p>
    </div>
  );
};

export function CategoryBarsChart({ rows, overallRealPct }: Props) {
  const [mounted, setMounted] = useState(false);
  const captionId = useId();

  useEffect(() => setMounted(true), []);

  if (!mounted) return <ChartSkeleton height={300} />;

  const sorted = [...rows].sort((a, b) => a.realPct - b.realPct);
  const data: BarEntry[] = sorted.map(r => ({
    label: r.label,
    pct: r.realPct,
    pctDisplay: formatPct(r.realPct),
  }));

  const minVal = Math.min(...data.map(d => d.pct), overallRealPct, -0.05);
  const maxVal = Math.max(...data.map(d => d.pct), overallRealPct, 0.05);

  return (
    <figure className="chart-figure" role="img" aria-labelledby={captionId}>
      <figcaption id={captionId} className="chart-caption">
        Horizontal bar chart of all {rows.length} CPI categories ranked by real impact on your salary.
        Worst: {sorted[0]?.label ?? ''} at {sorted[0] ? formatPct(sorted[0].realPct) : ''}.
      </figcaption>
      <ResponsiveContainer width="100%" height={sorted.length * 36 + 20}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 56, left: 4, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[minVal - 0.02, maxVal + 0.02]}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            tick={{ fontSize: 10 }}
          />
          <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke="var(--text-muted)" strokeWidth={1.5} />
          <ReferenceLine
            x={overallRealPct}
            stroke="var(--accent)"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{ value: 'You', position: 'top', fontSize: 10, fill: 'var(--accent)' }}
          />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]} isAnimationActive={true} animationDuration={600}>
            <LabelList
              dataKey="pctDisplay"
              position="right"
              style={{ fontSize: 10, fill: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}
            />
            {data.map((entry) => (
              <Cell
                key={entry.label}
                fill={entry.pct >= 0 ? 'var(--gain)' : 'var(--loss)'}
                fillOpacity={0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
