import React from 'react';
import { useLedger } from '../hooks/useLedger';
import { CATEGORIES, fmt } from '../constants';
import { StatCard } from './ui/StatCard';
import { CategoryRow } from './CategoryRow';
import { EntryRow } from './EntryRow';
import { EmptyState } from './ui/EmptyState';
import { Card } from './ui/Card';

interface DashboardProps {
  onNavigateToHistory: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToHistory }) => {
  const ledger = useLedger();

  const {
    entries,
    totals,
    capsTotals,
    breakdown,
    actions,
  } = ledger;

  const { today: todayTotal, week: weekTotal, month: monthTotal } = totals;
  const { weekly: weeklyCap, monthly: monthlyCap } = capsTotals;
  const { monthEntries, category: categoryBreakdown, maxCategorySpend } = breakdown;
  const { deleteExpense } = actions;

  // Sort and slice recent entries (8 most recent)
  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 8);

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
                amount={categoryBreakdown[c.id] || 0}
                maxAmount={maxCategorySpend}
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
                onDelete={deleteExpense}
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
