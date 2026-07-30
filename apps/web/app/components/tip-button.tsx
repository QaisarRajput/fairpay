import Link from 'next/link';

import { config } from '../../lib/site';

export function TipButton() {
  if (!config.monetization.tipUrl) {
    return (
      <button type="button" className="ghost" disabled aria-disabled="true">
        Support FairPay (coming soon)
      </button>
    );
  }

  return (
    <Link href={config.monetization.tipUrl} target="_blank" rel="noreferrer noopener" className="tip-link">
      Support FairPay
    </Link>
  );
}
