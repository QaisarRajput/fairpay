import { z } from 'zod';
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/;
export const IsoDate = z.string().regex(ISO_DATE_PATTERN, 'date must use YYYY-MM-DD format');
export const CpiPoint = z.object({
    date: IsoDate,
    value: z.number().finite(),
});
export const CpiSeries = z.object({
    seriesId: z.string().min(1),
    label: z.string().min(1),
    category: z.string().min(1),
    base: z.string().min(1),
    points: z.array(CpiPoint),
    contentHash: z.string().regex(SHA256_HEX_PATTERN, 'contentHash must be sha256 hex'),
});
export const CpiSeriesMeta = z.object({
    seriesId: z.string().min(1),
    label: z.string().min(1),
    category: z.string().min(1),
    base: z.string().min(1),
    startDate: IsoDate,
    endDate: IsoDate,
    pointCount: z.number().int().nonnegative(),
    contentHash: z.string().regex(SHA256_HEX_PATTERN, 'contentHash must be sha256 hex'),
});
export const CpiIndex = z.object({
    series: z.array(CpiSeriesMeta),
    coverageStart: IsoDate,
    coverageEnd: IsoDate,
    lastSyncedAt: z.string().datetime({ offset: true }),
});
//# sourceMappingURL=cpi.js.map