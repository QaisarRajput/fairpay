import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { CpiIndex } from '@fairpay/schema';

export async function readCpiIndex(): Promise<ReturnType<typeof CpiIndex.parse> | null> {
  const indexPath = resolve(process.cwd(), 'public', 'data', 'cpi', 'index.json');

  try {
    const raw = await readFile(indexPath, 'utf8');
    return CpiIndex.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}
