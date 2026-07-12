import { useAppDispatch, useAppSelector } from '../store';
import { addExpense, deleteExpense, updateCap } from '../store/ledgerSlice';
import {
  CATEGORIES,
  dkey,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  entriesBetween,
  sum,
} from '../constants';

export const useLedger = () => {
  const dispatch = useAppDispatch();
  const { entries, caps, syncStatus, gdriveFileId, lastSynced, error } = useAppSelector((state) => state.ledger);

  const now = new Date();
  const todayKey = dkey(now);
  const mFrom = startOfMonth(now);
  const mTo = endOfMonth(now);
  const wFrom = startOfWeek(now);
  const wTo = new Date(wFrom.getTime() + 6 * 86400000); // end of week

  // Filter entries
  const monthEntries = entriesBetween(entries, mFrom, mTo);
  const weekEntries = entriesBetween(entries, wFrom, wTo);

  // Sum aggregates
  const todayTotal = sum(entries.filter((e) => e.date === todayKey));
  const weekTotal = sum(weekEntries);
  const monthTotal = sum(monthEntries);

  // Budget threshold aggregates
  const weeklyCap = CATEGORIES.reduce((acc, c) => acc + (caps[c.id]?.weekly || 0), 0);
  const monthlyCap = CATEGORIES.reduce((acc, c) => acc + (caps[c.id]?.monthly || 0), 0);

  // Category breakdown metrics
  const categoryBreakdown = CATEGORIES.reduce((acc, c) => {
    acc[c.id] = 0;
    return acc;
  }, {} as Record<string, number>);

  monthEntries.forEach((e) => {
    if (categoryBreakdown[e.category] !== undefined) {
      categoryBreakdown[e.category] += e.amount;
    }
  });

  const maxCategorySpend = Math.max(...Object.values(categoryBreakdown), 1);

  // Actions
  const handleAddExpense = (amount: number, category: string, date: string, note: string) => {
    dispatch(addExpense({ amount, category, date, note }));
  };

  const handleDeleteExpense = (id: string) => {
    dispatch(deleteExpense(id));
  };

  const handleUpdateCap = (categoryId: string, period: 'weekly' | 'monthly', value: number) => {
    dispatch(updateCap({ categoryId, period, value }));
  };

  return {
    entries,
    caps,
    todayKey,
    sync: {
      status: syncStatus,
      gdriveFileId,
      lastSynced,
      error,
    },
    totals: {
      today: todayTotal,
      week: weekTotal,
      month: monthTotal,
    },
    capsTotals: {
      weekly: weeklyCap,
      monthly: monthlyCap,
    },
    breakdown: {
      monthEntries,
      weekEntries,
      category: categoryBreakdown,
      maxCategorySpend,
    },
    actions: {
      addExpense: handleAddExpense,
      deleteExpense: handleDeleteExpense,
      updateCap: handleUpdateCap,
    }
  };
};
