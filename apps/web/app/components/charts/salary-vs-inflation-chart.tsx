'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { CpiSeries } from '@fairpay/schema';
import { breakEven } from '@fairpay/calc';

import { ChartSkeleton } from './chart-skeleton';

type Props = {
  series: CpiSeries;
  fromDate: string;   // "2021-06"
  toDate: string;
  salaryFrom: number;
  salaryTo: number;
};

type Point = {
  month: string;
  label: string;
  nominalSalary: number | null;
  breakEvenLine: number;
  gap: number;
};

function buildPoints(series: CpiSeries, fromDate: string, toDate: string, salaryFrom: number, salaryTo: number): Point[] {
  const points: Point[] = [];
  for (const cp of series.points) {
    const m = cp.date.slice(0, 7);
    if (m < fromDate || m > toDate) continue;
    const be = breakEven(salaryFrom, fromDate, m, series.points);
    const nominal = m === fromDate ? salaryFrom : m === toDate ? salaryTo : null;
    points.push({
      month: m,
      label: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      nominalSalary: nominal,
      breakEvenLine: Math.round(be),
      gap: Math.round(salaryTo - be),
    });
  }
  return points;
}

function fmt(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  const be = payload.find(p => p.name === 'breakEvenLine');
  return (
    <div className="recharts-default-tooltip">
      <p className="recharts-tooltip-label">{label}</p>
      {be ? <p className="recharts-tooltip-item">Break-even: <strong>{fmt(be.value)}</strong></p> : null}
    </div>
  );
};

export function SalaryVsInflationChart({ series, fromDate, toDate, salaryFrom, salaryTo }: Props) {
  const [mounted, setMounted] = useState(false);
  const captionId = useId();
  const pointsRef = useRef<Point[]>([]);

  useEffect(() => {
    pointsRef.current = buildPoints(series, fromDate, toDate, salaryFrom, salaryTo);
    setMounted(true);
  }, [series, fromDate, toDate, salaryFrom, salaryTo]);

  const isGain = salaryTo >= breakEven(salaryFrom, fromDate, toDate, series.points);

  if (!mounted) return <ChartSkeleton height={200} />;

  const points = pointsRef.current;
  const finalBe = points[points.length - 1]?.breakEvenLine ?? 0;

  return (
    <figure className="chart-figure" role="img" aria-labelledby={captionId}>
      <figcaption id={captionId} className="chart-caption">
        Line chart showing your salary of {fmt(salaryTo)} versus the inflation break-even target of {fmt(finalBe)} from {fromDate} to {toDate}.
        {isGain ? ' You outpaced inflation.' : ' Inflation outpaced your salary.'}
      </figcaption>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis
            tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
            tick={{ fontSize: 11 }}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Shaded area between the two lines */}
          <Area
            dataKey="breakEvenLine"
            stroke="none"
            fill={isGain ? 'var(--gain)' : 'var(--loss)'}
            fillOpacity={0.1}
            isAnimationActive={false}
          />

          {/* Break-even CPI-adjusted line */}
          <Line
            type="monotone"
            dataKey="breakEvenLine"
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={false}
            name="Break-even"
            isAnimationActive={true}
            animationDuration={600}
          />

          {/* Salary markers */}
          <ReferenceLine
            y={salaryFrom}
            stroke="var(--text-muted)"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{ value: fmt(salaryFrom), position: 'insideTopLeft', fontSize: 10, fill: 'var(--text-muted)' }}
          />
          <ReferenceLine
            y={salaryTo}
            stroke={isGain ? 'var(--gain)' : 'var(--loss)'}
            strokeWidth={2}
            label={{ value: fmt(salaryTo), position: 'insideTopRight', fontSize: 10, fill: isGain ? 'var(--gain)' : 'var(--loss)' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </figure>
  );
}
