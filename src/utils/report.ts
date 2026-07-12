import type { Expense } from '../types';
import { CATEGORIES, CAT_MAP, entriesBetween, sum } from '../constants';

export interface ReportMetrics {
  filteredEntries: Expense[];
  totalSpend: number;
  daysInRange: number;
  dailyAverage: number;
  categoryTotals: Record<string, number>;
  maxCategorySpend: number;
  topCategoryLabel: string;
}

export const calculateReportMetrics = (
  entries: Expense[],
  fromDate: Date,
  toDate: Date
): ReportMetrics => {
  const filteredEntries = entriesBetween(entries, fromDate, toDate);
  const totalSpend = sum(filteredEntries);

  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const daysInRange = Math.max(1, diffDays);

  const dailyAverage = totalSpend / daysInRange;

  const categoryTotals = CATEGORIES.reduce((acc, c) => {
    acc[c.id] = 0;
    return acc;
  }, {} as Record<string, number>);

  filteredEntries.forEach((e) => {
    if (categoryTotals[e.category] !== undefined) {
      categoryTotals[e.category] += e.amount;
    }
  });

  const maxCategorySpend = Math.max(...Object.values(categoryTotals), 1);

  // Top Category Label calculation
  let topCategoryLabel = '—';
  if (filteredEntries.length > 0) {
    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topId = sorted[0]?.[0];
    const topVal = sorted[0]?.[1];
    if (topId && topVal > 0) {
      const cat = CAT_MAP[topId];
      topCategoryLabel = `${cat?.icon || ''} ${cat?.name || ''}`;
    }
  }

  return {
    filteredEntries,
    totalSpend,
    daysInRange,
    dailyAverage,
    categoryTotals,
    maxCategorySpend,
    topCategoryLabel,
  };
};
