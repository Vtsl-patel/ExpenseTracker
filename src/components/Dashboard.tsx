import React from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { deleteExpense } from '../store/ledgerSlice';
import {
  CATEGORIES,
  fmt,
  dkey,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  entriesBetween,
  sum,
} from '../constants';
import { StatCard } from './ui/StatCard';
import { CategoryRow } from './CategoryRow';
import { EntryRow } from './EntryRow';
import { EmptyState } from './ui/EmptyState';
import { Card } from './ui/Card';

interface DashboardProps {
  onNavigateToHistory: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToHistory }) => {
  const dispatch = useAppDispatch();
  
  // Fetch entries and caps from Redux store
  const { entries, caps } = useAppSelector((state) => state.ledger);

  const now = new Date();
  const todayKey = dkey(now);

  const mFrom = startOfMonth(now);
  const mTo = endOfMonth(now);

  const wFrom = startOfWeek(now);
  const wTo = new Date(wFrom.getTime() + 6 * 86400000); // end of week

  // Filter entries
  const monthEntries = entriesBetween(entries, mFrom, mTo);
  const weekEntries = entriesBetween(entries, wFrom, wTo);

  // Sums
  const todayTotal = sum(entries.filter((e) => e.date === todayKey));
  const weekTotal = sum(weekEntries);
  const monthTotal = sum(monthEntries);

  // Caps sum
  const weeklyCap = CATEGORIES.reduce((acc, c) => acc + (caps[c.id]?.weekly || 0), 0);
  const monthlyCap = CATEGORIES.reduce((acc, c) => acc + (caps[c.id]?.monthly || 0), 0);

  // Category values for this month
  const byCat = CATEGORIES.reduce((acc, c) => {
    acc[c.id] = 0;
    return acc;
  }, {} as Record<string, number>);

  monthEntries.forEach((e) => {
    if (byCat[e.category] !== undefined) {
      byCat[e.category] += e.amount;
    }
  });

  const maxCat = Math.max(...Object.values(byCat), 1);

  // Sort and slice recent entries (8 most recent)
  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 8);

  const handleDelete = (id: string) => {
    dispatch(deleteExpense(id));
  };

  return (
    <div className="flex flex-col gap-4.5">
      {/* Summary Stat Cards */}
      <div className="flex gap-4.5 mb-1 flex-wrap" id="summaryRow">
        <StatCard
          label="Today"
          value={todayTotal}
          hint={`${monthEntries.length} ${monthEntries.length === 1 ? 'entry' : 'entries'} this month`}
        />
        <StatCard
          label="This week"
          value={weekTotal}
          cap={weeklyCap}
          hint={weeklyCap > 0 ? `${fmt(Math.max(weeklyCap - weekTotal, 0))} left` : 'no weekly cap set'}
        />
        <StatCard
          label="This month"
          value={monthTotal}
          cap={monthlyCap}
          hint={monthlyCap > 0 ? `${fmt(Math.max(monthlyCap - monthTotal, 0))} left` : 'no monthly cap set'}
        />
      </div>

      {/* Categories Breakdown */}
      <Card>
        <div className="flex items-baseline justify-between mb-3.5">
          <h3 className="sec-title">By category — this month</h3>
        </div>
        <div id="catBreakdown" className="flex flex-col">
          {monthTotal === 0 ? (
            <EmptyState icon="🌱" text="No expenses logged this month yet." />
          ) : (
            CATEGORIES.map((c) => (
              <CategoryRow
                key={c.id}
                category={c}
                amount={byCat[c.id] || 0}
                maxAmount={maxCat}
              />
            ))
          )}
        </div>
      </Card>

      {/* Recent Entries */}
      <Card>
        <div className="flex items-baseline justify-between mb-3.5">
          <h3 className="sec-title">Recent entries</h3>
          <button 
            className="text-[13px] text-accent bg-transparent border-0 font-medium cursor-pointer hover:underline" 
            id="viewAllBtn" 
            onClick={onNavigateToHistory}
          >
            View history →
          </button>
        </div>
        <div id="recentEntries" className="flex flex-col">
          {recent.length ? (
            recent.map((e) => (
              <EntryRow 
                key={e.id}
                entry={e}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <EmptyState icon="🧾" text="Nothing yet — tap + to add your first expense." />
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
