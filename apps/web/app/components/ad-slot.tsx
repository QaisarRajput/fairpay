'use client';

import { useEffect } from 'react';

import { adsenseIds, config } from '../../lib/site';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSlotProps = {
  slot: string;
};

export function AdSlot({ slot }: AdSlotProps) {
  const shouldRender = Boolean(config.adsense.ready && adsenseIds.metaAndScript);

  useEffect(() => {
    if (!shouldRender || !slot || typeof window === 'undefined') {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Ignore ad script errors in static environments.
    }
  }, [shouldRender, slot]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="ad-slot" aria-label="Advertisement">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adsenseIds.metaAndScript}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
