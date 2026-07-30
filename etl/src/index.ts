import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { CpiIndex, type CpiSeries } from '@fairpay/schema';

import { fetchFredSeries } from './fetch';
import { CPI_SERIES_REGISTRY } from './series';

const MAX_SKIP_COUNT = 3;
const MAX_SKIP_RATIO = 0.01;

type WriteResult = {
	changed: boolean;
};

function toPrettyJson(value: unknown): string {
	return `${JSON.stringify(value, null, 2)}\n`;
}

async function writeJsonIfChanged(filePath: string, value: unknown): Promise<WriteResult> {
	const next = toPrettyJson(value);

	try {
		const current = await readFile(filePath, 'utf8');
		if (current === next) {
			return { changed: false };
		}
	} catch {
		// File does not exist yet; proceed to create it.
	}

	await writeFile(filePath, next, 'utf8');
	return { changed: true };
}

function assertApiKey(): string {
	const key = process.env.FRED_API_KEY;
	if (!key) {
		throw new Error('Missing FRED_API_KEY. Set it in your environment before running ETL sync.');
	}

	return key;
}

function summarizeCoverage(seriesList: CpiSeries[]): { coverageStart: string; coverageEnd: string } {
	const starts = seriesList.map((series) => series.points[0]?.date).filter(Boolean) as string[];
	const ends = seriesList
		.map((series) => series.points[series.points.length - 1]?.date)
		.filter(Boolean) as string[];

	const coverageStart = starts.sort((left, right) => left.localeCompare(right))[0];
	const coverageEnd = ends.sort((left, right) => left.localeCompare(right))[ends.length - 1];

	if (!coverageStart || !coverageEnd) {
		throw new Error('Unable to determine CPI coverage range from fetched series.');
	}

	return { coverageStart, coverageEnd };
}

async function run(): Promise<void> {
	const apiKey = assertApiKey();
	const repoRoot = resolve(process.cwd(), '..');
	const cpiDir = resolve(repoRoot, 'data', 'cpi');
	await mkdir(cpiDir, { recursive: true });

	const results = [];
	let totalRows = 0;
	let malformedRows = 0;
	let missingValueRows = 0;

	for (const definition of CPI_SERIES_REGISTRY) {
		const result = await fetchFredSeries(definition, apiKey);
		results.push(result);
		totalRows += result.totalRows;
		malformedRows += result.malformedRows;
		missingValueRows += result.missingValueRows;
	}

	const malformedRatio = totalRows === 0 ? 0 : malformedRows / totalRows;
	if (malformedRows > MAX_SKIP_COUNT || malformedRatio > MAX_SKIP_RATIO) {
		throw new Error(
			`ETL drift threshold exceeded: malformed ${malformedRows}/${totalRows} rows (${(malformedRatio * 100).toFixed(2)}%).`,
		);
	}

	for (const result of results) {
		for (const warning of result.warnings) {
			console.warn(`WARN ${warning}`);
		}
	}

	const seriesList = results
		.map((result) => result.series)
		.filter((value): value is CpiSeries => value !== null);

	if (seriesList.length === 0) {
		throw new Error('No CPI series were produced by ETL.');
	}

	const changedFiles: string[] = [];
	for (const series of seriesList) {
		const filePath = resolve(cpiDir, `${series.seriesId}.json`);
		const write = await writeJsonIfChanged(filePath, series);
		if (write.changed) {
			changedFiles.push(filePath);
		}
	}

	const { coverageStart, coverageEnd } = summarizeCoverage(seriesList);
	const index = CpiIndex.parse({
		series: seriesList.map((series) => ({
			seriesId: series.seriesId,
			label: series.label,
			category: series.category,
			base: series.base,
			startDate: series.points[0]?.date,
			endDate: series.points[series.points.length - 1]?.date,
			pointCount: series.points.length,
			contentHash: series.contentHash,
		})),
		coverageStart,
		coverageEnd,
		lastSyncedAt: new Date().toISOString(),
	});

	const indexWrite = await writeJsonIfChanged(resolve(cpiDir, 'index.json'), index);
	if (indexWrite.changed) {
		changedFiles.push(resolve(cpiDir, 'index.json'));
	}

	console.log(
		`ETL completed: ${seriesList.length} series, ${totalRows} rows, ${malformedRows} malformed, ${missingValueRows} missing-value markers, ${changedFiles.length} file(s) changed.`,
	);
}

run().catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exit(1);
});
