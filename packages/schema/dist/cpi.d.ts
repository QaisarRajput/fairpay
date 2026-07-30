import { z } from 'zod';
export declare const IsoDate: z.ZodString;
export declare const CpiPoint: z.ZodObject<{
    date: z.ZodString;
    value: z.ZodNumber;
}, z.core.$strip>;
export type CpiPoint = z.infer<typeof CpiPoint>;
export declare const CpiSeries: z.ZodObject<{
    seriesId: z.ZodString;
    label: z.ZodString;
    category: z.ZodString;
    base: z.ZodString;
    points: z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        value: z.ZodNumber;
    }, z.core.$strip>>;
    contentHash: z.ZodString;
}, z.core.$strip>;
export type CpiSeries = z.infer<typeof CpiSeries>;
export declare const CpiSeriesMeta: z.ZodObject<{
    seriesId: z.ZodString;
    label: z.ZodString;
    category: z.ZodString;
    base: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    pointCount: z.ZodNumber;
    contentHash: z.ZodString;
}, z.core.$strip>;
export type CpiSeriesMeta = z.infer<typeof CpiSeriesMeta>;
export declare const CpiIndex: z.ZodObject<{
    series: z.ZodArray<z.ZodObject<{
        seriesId: z.ZodString;
        label: z.ZodString;
        category: z.ZodString;
        base: z.ZodString;
        startDate: z.ZodString;
        endDate: z.ZodString;
        pointCount: z.ZodNumber;
        contentHash: z.ZodString;
    }, z.core.$strip>>;
    coverageStart: z.ZodString;
    coverageEnd: z.ZodString;
    lastSyncedAt: z.ZodString;
}, z.core.$strip>;
export type CpiIndex = z.infer<typeof CpiIndex>;
//# sourceMappingURL=cpi.d.ts.map