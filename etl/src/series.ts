export type CpiSeriesDefinition = {
  seriesId: string;
  label: string;
  category: string;
  base: string;
};

export const CPI_SERIES_REGISTRY: CpiSeriesDefinition[] = [
  {
    seriesId: 'CPIAUCSL',
    label: 'All items (headline)',
    category: 'all-items',
    base: 'series-specific index',
  },
  {
    seriesId: 'CPIUFDSL',
    label: 'Food',
    category: 'food',
    base: 'series-specific index',
  },
  {
    seriesId: 'CPIHOSSL',
    label: 'Housing',
    category: 'housing',
    base: 'series-specific index',
  },
  {
    seriesId: 'CPITRNSL',
    label: 'Transportation',
    category: 'transportation',
    base: 'series-specific index',
  },
  {
    seriesId: 'CPIMEDSL',
    label: 'Medical care',
    category: 'medical-care',
    base: 'series-specific index',
  },
  {
    seriesId: 'CPIAPPSL',
    label: 'Apparel',
    category: 'apparel',
    base: 'series-specific index',
  },
  {
    seriesId: 'CPIRECSL',
    label: 'Recreation',
    category: 'recreation',
    base: 'series-specific index',
  },
  {
    seriesId: 'CPIEDUSL',
    label: 'Education & communication',
    category: 'education-communication',
    base: 'series-specific index',
  },
  {
    seriesId: 'CPIENGSL',
    label: 'Energy',
    category: 'energy',
    base: 'series-specific index',
  },
];
