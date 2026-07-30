'use client';

import { useEffect, useId, useState } from 'react';

type GaugeProps = {
  /** Value from -1 to 1+ representing real % change */
  realPct: number;
  size?: number;
};

// Converts a -1..+1 pct value to a 0..1 fill ratio, clamped at visual extremes
function pctToFill(pct: number): number {
  // Map -50%..+50% to 0..1. Beyond that range clamp.
  return Math.max(0, Math.min(1, (pct + 0.5) / 1));
}

export function PurchasingPowerGauge({ realPct, size = 180 }: GaugeProps) {
  const id = useId();
  const [fill, setFill] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    const target = pctToFill(realPct);
    if (reducedMotion) {
      setFill(target);
      return;
    }

    const start = performance.now();
    const duration = 750;
    const from = 0;

    let rafId = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Spring-like ease: cubic-out
      const eased = 1 - Math.pow(1 - t, 3);
      setFill(from + (target - from) * eased);
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [realPct, reducedMotion]);

  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) * 0.78;
  const strokeWidth = size * 0.065;

  // 270° arc (3/4 circle), starting at 135° (bottom-left), going clockwise
  const startAngle = 135;
  const totalAngle = 270;
  const angle = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const start = angle(startAngle);
  const endAngle = startAngle + totalAngle;
  const end = angle(endAngle);

  const trackPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 1 1 ${end.x} ${end.y}`;

  const fillAngleEnd = startAngle + totalAngle * fill;
  const fillEnd = angle(fillAngleEnd);
  const largeArc = totalAngle * fill > 180 ? 1 : 0;
  const fillPath = fill <= 0
    ? ''
    : `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${fillEnd.x} ${fillEnd.y}`;

  const isGain = realPct >= 0;
  const fillColor = isGain ? 'var(--gain)' : 'var(--loss)';
  const pctLabel = `${realPct >= 0 ? '+' : ''}${(realPct * 100).toFixed(1)}%`;

  const captionId = `${id}-caption`;

  return (
    <figure className="gauge-wrapper chart-figure" role="img" aria-labelledby={captionId}>
      <figcaption id={captionId} className="chart-caption">
        Purchasing power gauge: {pctLabel} real change
      </figcaption>
      <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size}`} overflow="visible">
        {/* Track */}
        <path d={trackPath} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Fill */}
        {fillPath ? (
          <path d={fillPath} fill="none" stroke={fillColor} strokeWidth={strokeWidth} strokeLinecap="round" opacity="0.9" />
        ) : null}
        {/* Center text */}
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontFamily="var(--font-mono, 'JetBrains Mono', monospace)"
          fontWeight="700"
          fontSize={size * 0.16}
          fill={fillColor}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {pctLabel}
        </text>
        <text x={cx} y={cy + size * 0.14 + 4} textAnchor="middle" fontSize={size * 0.075} fill="var(--text-muted)" fontFamily="inherit">
          real change
        </text>
      </svg>
    </figure>
  );
}
