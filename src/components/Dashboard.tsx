import React from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { deleteExpense } from '../store/ledgerSlice';
import {
  CATEGORIES,
  CAT_MAP,
  fmt,
  dkey,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  entriesBetween,
  sum,
} from '../constants';

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

  // Helper to render Stat Cards
  const renderStatCard = (label: string, value: number, cap: number, hint: string) => {
    const isOver = cap > 0 && value > cap;
    let barHtml = null;

    if (cap > 0) {
      const pct = Math.min((value / cap) * 100, 100);
      barHtml = (
        <div className="h-1.5 rounded-full bg-bg-sunken overflow-hidden mt-2.5">
          <div
            className={`h-full rounded-full transition-all duration-400 ease-in-out ${isOver ? 'bg-bad' : 'bg-accent'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      );
    }

    return (
      <div className="flex-1 min-w-[150px] bg-bg-elev border border-line rounded-custom p-[18px_20px] shadow-custom" key={label}>
        <div className="text-[11px] uppercase tracking-[0.07em] text-ink-faint mb-2">{label}</div>
        <div className={`font-display text-[28px] font-semibold tracking-[-0.01em] ${isOver ? 'text-bad' : 'text-ink'}`}>{fmt(value)}</div>
        <div className="text-xs text-ink-faint mt-1.5">{hint}</div>
        {barHtml}
      </div>
    );
  };

  return (
    <div>
      {/* Summary Stat Cards */}
      <div className="flex gap-4.5 mb-4.5 flex-wrap" id="summaryRow">
        {renderStatCard(
          'Today',
          todayTotal,
          0,
          `${monthEntries.length} ${monthEntries.length === 1 ? 'entry' : 'entries'} this month`
        )}
        {renderStatCard(
          'This week',
          weekTotal,
          weeklyCap,
          weeklyCap > 0
            ? `${fmt(Math.max(weeklyCap - weekTotal, 0))} left`
            : 'no weekly cap set'
        )}
        {renderStatCard(
          'This month',
          monthTotal,
          monthlyCap,
          monthlyCap > 0
            ? `${fmt(Math.max(monthlyCap - monthTotal, 0))} left`
            : 'no monthly cap set'
        )}
      </div>

      {/* Categories Breakdown */}
      <div className="bg-bg-elev border border-line rounded-custom p-6 shadow-custom mb-[18px]">
        <div className="flex items-baseline justify-between mb-3.5">
          <span className="font-display text-lg font-semibold text-ink">By category — this month</span>
        </div>
        <div id="catBreakdown">
          {monthTotal === 0 ? (
            <div className="text-center p-[40px_20px] text-ink-faint">
              <div className="text-[32px] mb-2.5">🌱</div>
              <p className="text-[13px] text-ink-soft">No expenses logged this month yet.</p>
            </div>
          ) : (
            CATEGORIES.map((c) => {
              const amt = byCat[c.id] || 0;
              const fillPct = (amt / maxCat) * 100;
              return (
                <div className="flex items-center gap-3.5 py-3.5 border-b border-line last:border-b-0" key={c.id}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-sm font-medium text-ink flex-1">
                    {c.icon} {c.name}
                  </span>
                  <span className="basis-[120px] h-1.25 rounded-[3px] bg-bg-sunken overflow-hidden max-[560px]:hidden">
                    <span
                      className="h-full rounded-[3px] block"
                      style={{
                        width: `${fillPct}%`,
                        backgroundColor: c.color,
                      }}
                    />
                  </span>
                  <span className="font-mono text-sm text-ink-soft">{fmt(amt)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Entries */}
      <div className="bg-bg-elev border border-line rounded-custom p-6 shadow-custom">
        <div className="flex items-baseline justify-between mb-3.5">
          <span className="font-display text-lg font-semibold text-ink">Recent entries</span>
          <button className="text-[13px] text-accent bg-transparent border-0 font-medium cursor-pointer hover:underline" id="viewAllBtn" onClick={onNavigateToHistory}>
            View history →
          </button>
        </div>
        <div id="recentEntries">
          {recent.length ? (
            recent.map((e) => {
              const c = CAT_MAP[e.category] || CATEGORIES[0];
              const dateLabel = new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              });
              return (
                <div className="flex items-center gap-3.5 py-3.25 border-b border-line last:border-b-0 group" key={e.id}>
                  <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-base shrink-0" style={{ backgroundColor: `${c.color}22` }}>
                    {c.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{e.note ? e.note : c.name}</div>
                    <div className="text-xs text-ink-faint mt-0.5">
                      {c.name} · {dateLabel}
                    </div>
                  </span>
                  <span className="font-mono text-sm font-semibold text-ink shrink-0">{fmt(e.amount)}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition duration-150 ease-in-out w-6.5 h-6.5 rounded-full border-none bg-transparent text-ink-faint flex items-center justify-center hover:text-bad hover:bg-bg-sunken cursor-pointer focus:opacity-100 outline-none"
                    data-id={e.id}
                    title="Delete"
                    onClick={() => handleDelete(e.id)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    >
                      <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6h12z" />
                    </svg>
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center p-[40px_20px] text-ink-faint">
              <div className="text-[32px] mb-2.5">🧾</div>
              <p className="text-[13px] text-ink-soft">Nothing yet — tap + to add your first expense.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
