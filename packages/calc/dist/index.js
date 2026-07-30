const YEAR_MONTH_PATTERN = /^\d{4}-\d{2}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
function isValidIsoDate(date) {
    if (!ISO_DATE_PATTERN.test(date)) {
        return false;
    }
    const [yearStr, monthStr, dayStr] = date.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    const utc = new Date(Date.UTC(year, month - 1, day));
    return (Number.isInteger(year) &&
        Number.isInteger(month) &&
        Number.isInteger(day) &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31 &&
        utc.getUTCFullYear() === year &&
        utc.getUTCMonth() === month - 1 &&
        utc.getUTCDate() === day);
}
function normalizeLookupDate(date) {
    if (YEAR_MONTH_PATTERN.test(date)) {
        return `${date}-31`;
    }
    if (!isValidIsoDate(date)) {
        throw new Error(`Invalid date: ${date}. Expected YYYY-MM or YYYY-MM-DD.`);
    }
    return date;
}
function requirePoints(points) {
    if (points.length === 0) {
        throw new Error('CPI point set is empty.');
    }
}
function requirePositiveSalary(amount, fieldName) {
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(`${fieldName} must be a positive number.`);
    }
}
function lookupCpiValue(points, date) {
    const point = nearestPointAtOrBefore(points, date);
    if (!point) {
        throw new Error(`No CPI data found at or before ${date}.`);
    }
    return point.value;
}
export function nearestPointAtOrBefore(points, date) {
    requirePoints(points);
    const targetDate = normalizeLookupDate(date);
    for (let index = points.length - 1; index >= 0; index -= 1) {
        const point = points[index];
        if (!point) {
            continue;
        }
        if (point.date <= targetDate) {
            return point;
        }
    }
    return undefined;
}
export function breakEven(salaryFrom, fromDate, toDate, points) {
    requirePositiveSalary(salaryFrom, 'salaryFrom');
    const c0 = lookupCpiValue(points, fromDate);
    const c1 = lookupCpiValue(points, toDate);
    return salaryFrom * (c1 / c0);
}
export function realValue(salaryTo, fromDate, toDate, points) {
    requirePositiveSalary(salaryTo, 'salaryTo');
    const c0 = lookupCpiValue(points, fromDate);
    const c1 = lookupCpiValue(points, toDate);
    return salaryTo * (c0 / c1);
}
export function realPct(salaryFrom, salaryTo, fromDate, toDate, points) {
    requirePositiveSalary(salaryTo, 'salaryTo');
    const required = breakEven(salaryFrom, fromDate, toDate, points);
    return salaryTo / required - 1;
}
export function categoryDivergence(input) {
    if (input.series.length === 0) {
        throw new Error('At least one CPI series is required.');
    }
    const rows = input.series.map((series) => ({
        seriesId: series.seriesId,
        label: series.label,
        category: series.category,
        realPct: realPct(input.salaryFrom, input.salaryTo, input.fromDate, input.toDate, series.points),
    }));
    const sorted = [...rows].sort((left, right) => left.realPct - right.realPct);
    const worst = sorted[0];
    if (!worst) {
        throw new Error('Unable to compute category divergence.');
    }
    return {
        rows,
        worst,
    };
}
//# sourceMappingURL=index.js.map