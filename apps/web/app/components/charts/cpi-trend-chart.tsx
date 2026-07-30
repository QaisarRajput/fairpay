'use client';

import { useEffect, useId, useState } from 'react';
import {
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { CpiSeries } from '@fairpay/schema';

import { ChartSkeleton } from './chart-skeleton';

type Props = {
  series: CpiSeries;
  fromDate?: string;
  toDate?: string;
};

type Point = {
  month: string;
  label: string;
  value: number;
};

function buildPoints(series: CpiSeries): Point[] {
  return series.points.map(p => ({
    month: p.date.slice(0, 7),
    label: new Date(p.date.slice(0, 7) + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    value: p.value,
  }));
}

function findLastIndex<T>(arr: T[], pred: (v: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (pred(arr[i]!)) return i;
  }
  return -1;
}

function defaultBrushRange(points: Point[], fromDate?: string, toDate?: string): [number, number] {
  if (!fromDate || !toDate) return [Math.max(0, points.length - 60), points.length - 1];
  const fromIdx = points.findIndex(p => p.month >= fromDate);
  const toIdx = findLastIndex(points, p => p.month <= toDate);
  const pad = 6;
  return [Math.max(0, fromIdx - pad), Math.min(points.length - 1, toIdx + pad)];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="recharts-default-tooltip">
      <p className="recharts-tooltip-label">{label}</p>
      <p className="recharts-tooltip-item">CPI index: <strong>{payload[0]?.value.toFixed(3)}</strong></p>
    </div>
  );
};

export function CpiTrendChart({ series, fromDate, toDate }: Props) {
  const [mounted, setMounted] = useState(false);
  const captionId = useId();

  useEffect(() => setMounted(true), []);

  if (!mounted) return <ChartSkeleton height={280} />;

  const points = buildPoints(series);
  const [brushStart, brushEnd] = defaultBrushRange(points, fromDate, toDate);

  const fromIdx = fromDate ? points.findIndex(p => p.month === fromDate) : -1;
  const toIdx = toDate ? findLastIndex(points, p => p.month === toDate) : -1;

  return (
    <figure className="chart-figure" role="img" aria-labelledby={captionId}>
      <figcaption id={captionId} className="chart-caption">
        {series.label} CPI index history from {series.points[0]?.date.slice(0, 7)} to {series.points[series.points.length - 1]?.date.slice(0, 7)}.
        Use the range selector below to zoom in.
      </figcaption>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={40} />
          <YAxis tick={{ fontSize: 10 }} width={44} />
          <Tooltip content={<CustomTooltip />} />

          {fromDate && toDate && fromIdx >= 0 && toIdx >= 0 && points[fromIdx] && points[toIdx] ? (
            <ReferenceArea
              x1={points[fromIdx].label}
              x2={points[toIdx].label}
              fill="var(--accent)"
              fillOpacity={0.07}
            />
          ) : null}

          {fromDate && fromIdx >= 0 && points[fromIdx] ? (
            <ReferenceLine
              x={points[fromIdx].label}
              stroke="var(--accent)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              label={{ value: 'Start', position: 'insideTopLeft', fontSize: 10, fill: 'var(--accent)' }}
            />
          ) : null}

          {toDate && toIdx >= 0 && points[toIdx] ? (
            <ReferenceLine
              x={points[toIdx].label}
              stroke="var(--accent)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              label={{ value: 'End', position: 'insideTopRight', fontSize: 10, fill: 'var(--accent)' }}
            />
          ) : null}

          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            animationDuration={600}
          />

          <Brush
            dataKey="label"
            height={30}
            startIndex={brushStart}
            endIndex={brushEnd}
            fill="var(--surface-muted)"
            stroke="var(--border)"
            travellerWidth={8}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </figure>
  );
}
