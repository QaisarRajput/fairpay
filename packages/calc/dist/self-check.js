import assert from 'node:assert/strict';
import { breakEven, categoryDivergence, nearestPointAtOrBefore, realPct, realValue, } from './index';
const fromDate = '2021-06';
const toDate = '2024-06';
const allItemsSeries = {
    seriesId: 'CPIAUCSL',
    label: 'All items',
    category: 'all-items',
    base: 'series-specific index',
    contentHash: 'a'.repeat(64),
    points: [
        { date: '2021-06-01', value: 100 },
        { date: '2024-06-01', value: 120 },
    ],
};
const transportationSeries = {
    seriesId: 'CPITRNSL',
    label: 'Transportation',
    category: 'transportation',
    base: 'series-specific index',
    contentHash: 'b'.repeat(64),
    points: [
        { date: '2021-06-01', value: 100 },
        { date: '2024-06-01', value: 128 },
    ],
};
const salaryFrom = 50_000;
const salaryTo = 55_000;
const breakEvenValue = breakEven(salaryFrom, fromDate, toDate, allItemsSeries.points);
assert.equal(breakEvenValue, 60_000);
const realValueResult = realValue(salaryTo, fromDate, toDate, allItemsSeries.points);
assert.equal(realValueResult, 45_833.333333333336);
const realPctResult = realPct(salaryFrom, salaryTo, fromDate, toDate, allItemsSeries.points);
assert.equal(realPctResult, -0.08333333333333337);
const nearest = nearestPointAtOrBefore(allItemsSeries.points, '2021-06-15');
assert.deepEqual(nearest, { date: '2021-06-01', value: 100 });
const divergence = categoryDivergence({
    salaryFrom,
    salaryTo,
    fromDate,
    toDate,
    series: [allItemsSeries, transportationSeries],
});
assert.equal(divergence.worst.seriesId, 'CPITRNSL');
assert.equal(divergence.worst.realPct, -0.140625);
console.log('calc self-check passed');
//# sourceMappingURL=self-check.js.map