import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { externalUrls } from '../config/site';

const targetPath = resolve(process.cwd(), 'apps', 'web', 'public', 'workbox-cdn-url.js');

async function main(): Promise<void> {
  const content = `importScripts('${externalUrls.workboxCdn}');\n`;
  await writeFile(targetPath, content, 'utf8');
  console.log(`Wrote ${targetPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
