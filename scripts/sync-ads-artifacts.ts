import { rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { adsenseIds, config } from '../config/site';

const adsTxtPath = resolve(process.cwd(), 'apps', 'web', 'public', 'ads.txt');
const sellerLine = adsenseIds.adsTxt
  ? `google.com, ${adsenseIds.adsTxt}, DIRECT, f08c47fec0942fa0\n`
  : '';

async function main(): Promise<void> {
  if (!config.adsense.publisherId) {
    try {
      await rm(adsTxtPath);
      console.log('Removed ads.txt because AdSense publisher ID is not set.');
    } catch {
      console.log('ads.txt not generated because AdSense publisher ID is not set.');
    }
    return;
  }

  await writeFile(adsTxtPath, sellerLine, 'utf8');
  console.log(`Wrote ${adsTxtPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
