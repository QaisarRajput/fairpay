import type { CpiPoint, CpiSeries } from '@fairpay/schema';
export type CpiSeriesLike = Pick<CpiSeries, 'seriesId' | 'label' | 'category' | 'points'>;
export type CategoryDivergenceInput = {
    salaryFrom: number;
    salaryTo: number;
    fromDate: string;
    toDate: string;
    series: CpiSeriesLike[];
};
export type CategoryDivergenceRow = {
    seriesId: string;
    label: string;
    category: string;
    realPct: number;
};
export type CategoryDivergenceResult = {
    rows: CategoryDivergenceRow[];
    worst: CategoryDivergenceRow;
};
export declare function nearestPointAtOrBefore(points: CpiPoint[], date: string): CpiPoint | undefined;
export declare function breakEven(salaryFrom: number, fromDate: string, toDate: string, points: CpiPoint[]): number;
export declare function realValue(salaryTo: number, fromDate: string, toDate: string, points: CpiPoint[]): number;
export declare function realPct(salaryFrom: number, salaryTo: number, fromDate: string, toDate: string, points: CpiPoint[]): number;
export declare function categoryDivergence(input: CategoryDivergenceInput): CategoryDivergenceResult;
//# sourceMappingURL=index.d.ts.map