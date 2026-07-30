import { createHash } from 'node:crypto';

import { CpiSeries } from '@fairpay/schema';
import { z } from 'zod';

import type { CpiSeriesDefinition } from './series';

const FRED_RESPONSE = z.object({
  observations: z.array(
    z.object({
      date: z.string(),
      value: z.string(),
    }),
  ),
});

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FRED_OBSERVATIONS_BASE = 'https://api.stlouisfed.org/fred/series/observations';

export type SeriesFetchResult = {
  definition: CpiSeriesDefinition;
  series: z.infer<typeof CpiSeries> | null;
  totalRows: number;
  malformedRows: number;
  missingValueRows: number;
  warnings: string[];
};

function normalizeObservationDate(rawDate: string): string {
  if (!ISO_DATE_PATTERN.test(rawDate)) {
    throw new Error(`invalid date format: ${rawDate}`);
  }

  const [yearStr, monthStr, dayStr] = rawDate.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const utc = new Date(Date.UTC(year, month - 1, day));

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    throw new Error(`invalid calendar date: ${rawDate}`);
  }

  return rawDate;
}

function toContentHash(points: Array<{ date: string; value: number }>): string {
  const normalized = JSON.stringify(points);
  return createHash('sha256').update(normalized).digest('hex');
}

export async function fetchFredSeries(
  definition: CpiSeriesDefinition,
  apiKey: string,
): Promise<SeriesFetchResult> {
  const params = new URLSearchParams({
    series_id: definition.seriesId,
    api_key: apiKey,
    file_type: 'json',
  });

  const response = await fetch(`${FRED_OBSERVATIONS_BASE}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`FRED request failed for ${definition.seriesId}: ${response.status}`);
  }

  const json = await response.json();
  const parsedResponse = FRED_RESPONSE.safeParse(json);
  if (!parsedResponse.success) {
    throw new Error(`Invalid FRED response for ${definition.seriesId}`);
  }

  const warnings: string[] = [];
  const points: Array<{ date: string; value: number }> = [];
  let malformedRows = 0;
  let missingValueRows = 0;

  for (const [index, observation] of parsedResponse.data.observations.entries()) {
    try {
      if (observation.value === '.') {
        missingValueRows += 1;
        warnings.push(`${definition.seriesId}[${index}] missing value marker`);
        continue;
      }

      const date = normalizeObservationDate(observation.date);
      const value = Number(observation.value);
      if (!Number.isFinite(value)) {
        throw new Error(`invalid numeric value: ${observation.value}`);
      }

      points.push({ date, value });
    } catch (error) {
      malformedRows += 1;
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`${definition.seriesId}[${index}] ${message}`);
    }
  }

  points.sort((left, right) => left.date.localeCompare(right.date));

  if (points.length === 0) {
    warnings.push(`${definition.seriesId} returned no usable observations and was skipped`);
    return {
      definition,
      series: null,
      totalRows: parsedResponse.data.observations.length,
      malformedRows,
      missingValueRows,
      warnings,
    };
  }

  const series = CpiSeries.parse({
    seriesId: definition.seriesId,
    label: definition.label,
    category: definition.category,
    base: definition.base,
    points,
    contentHash: toContentHash(points),
  });

  return {
    definition,
    series,
    totalRows: parsedResponse.data.observations.length,
    malformedRows,
    missingValueRows,
    warnings,
  };
}
