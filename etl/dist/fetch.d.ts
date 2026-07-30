import { CpiSeries } from '@fairpay/schema';
import { z } from 'zod';
import type { CpiSeriesDefinition } from './series';
export type SeriesFetchResult = {
    definition: CpiSeriesDefinition;
    series: z.infer<typeof CpiSeries> | null;
    totalRows: number;
    malformedRows: number;
    missingValueRows: number;
    warnings: string[];
};
export declare function fetchFredSeries(definition: CpiSeriesDefinition, apiKey: string): Promise<SeriesFetchResult>;
//# sourceMappingURL=fetch.d.ts.map