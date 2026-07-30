import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { CpiIndex, CpiSeries } from '@fairpay/schema';

async function readJson(path: string): Promise<unknown> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw);
}

async function run(): Promise<void> {
  const cpiDir = resolve(process.cwd(), '..', 'data', 'cpi');
  const indexPath = resolve(cpiDir, 'index.json');

  let indexRaw: unknown;
  try {
    indexRaw = await readJson(indexPath);
  } catch (error) {
    const maybeErrno = error as NodeJS.ErrnoException;
    if (maybeErrno.code === 'ENOENT') {
      throw new Error(
        'Missing data/cpi/index.json. Run `pnpm --filter @fairpay/etl run sync` with FRED_API_KEY first.',
      );
    }

    throw error;
  }

  const index = CpiIndex.parse(indexRaw);

  if (index.series.length === 0) {
    throw new Error('index.json contains no series.');
  }

  const starts: string[] = [];
  const ends: string[] = [];

  for (const meta of index.series) {
    const seriesPath = resolve(cpiDir, `${meta.seriesId}.json`);
    const series = CpiSeries.parse(await readJson(seriesPath));

    if (series.seriesId !== meta.seriesId) {
      throw new Error(`Series ID mismatch for ${meta.seriesId}`);
    }
    if (series.contentHash !== meta.contentHash) {
      throw new Error(`contentHash mismatch for ${meta.seriesId}`);
    }

    const startDate = series.points[0]?.date;
    const endDate = series.points[series.points.length - 1]?.date;
    if (!startDate || !endDate) {
      throw new Error(`Series ${meta.seriesId} contains no points.`);
    }
    if (startDate !== meta.startDate || endDate !== meta.endDate) {
      throw new Error(`Coverage mismatch for ${meta.seriesId}`);
    }

    starts.push(startDate);
    ends.push(endDate);
  }

  const coverageStart = starts.sort((left, right) => left.localeCompare(right))[0];
  const coverageEnd = ends.sort((left, right) => left.localeCompare(right))[ends.length - 1];

  if (coverageStart !== index.coverageStart || coverageEnd !== index.coverageEnd) {
    throw new Error('Coverage range mismatch between index manifest and series files.');
  }

  console.log(`Validated ${index.series.length} CPI series chunk(s).`);
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
