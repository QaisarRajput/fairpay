'use client';

import { useEffect, useId, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type OfferEntry = {
  id: string;
  label: string;
  amount: number;
  realPct: number;
};

type Props = {
  offers: OfferEntry[];
  currentRealValue: number;
  salaryFromLabel: string;
};

function fmt(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

function fmtPct(v: number) {
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  const nominal = payload.find(p => p.name === 'amount');
  return (
    <div className="recharts-default-tooltip">
      <p className="recharts-tooltip-label">{label}</p>
      {nominal ? <p className="recharts-tooltip-item">Salary: <strong>{fmt(nominal.value)}</strong></p> : null}
    </div>
  );
};

export function OfferChart({ offers, currentRealValue, salaryFromLabel }: Props) {
  const [mounted, setMounted] = useState(false);
  const captionId = useId();

  useEffect(() => setMounted(true), []);

  if (!mounted || offers.length === 0) return null;

  return (
    <figure className="chart-figure" role="img" aria-labelledby={captionId}>
      <figcaption id={captionId} className="chart-caption">
        Bar chart comparing {offers.length} salary offer(s) against your current salary of {fmt(currentRealValue)} in real terms.
      </figcaption>
      <ResponsiveContainer width="100%" height={Math.max(180, offers.length * 56 + 60)}>
        <BarChart
          data={offers}
          margin={{ top: 16, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} width={44} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={currentRealValue}
            stroke="var(--accent)"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{ value: `Current (${salaryFromLabel})`, position: 'insideTopRight', fontSize: 10, fill: 'var(--accent)' }}
          />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={600}>
            {offers.map((entry) => (
              <Cell
                key={entry.id}
                fill={entry.amount >= currentRealValue ? 'var(--gain)' : 'var(--loss)'}
                fillOpacity={0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
        {offers.map(o => (
          <span key={o.id} style={{ fontSize: 'var(--t-xs)', color: 'var(--text-muted)' }}>
            {o.label}: {fmt(o.amount)}{' '}
            <span className={o.realPct >= 0 ? 'gain' : 'loss'}>{fmtPct(o.realPct)}</span>
          </span>
        ))}
      </div>
    </figure>
  );
}
