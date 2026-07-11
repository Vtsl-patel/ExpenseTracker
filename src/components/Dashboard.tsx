import React from 'react';
import type { Expense, Caps } from '../types';
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
  entries: Expense[];
  caps: Caps;
  onDeleteEntry: (id: string) => void;
  onNavigateToHistory: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  entries,
  caps,
  onDeleteEntry,
  onNavigateToHistory,
}) => {
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

  // Helper to render Stat Cards
  const renderStatCard = (label: string, value: number, cap: number, hint: string) => {
    const isOver = cap > 0 && value > cap;
    let barHtml = null;

    if (cap > 0) {
      const pct = Math.min((value / cap) * 100, 100);
      barHtml = (
        <div className="cap-bar-track">
          <div
            className={`cap-bar-fill ${isOver ? 'over' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      );
    }

    return (
      <div className="stat" key={label}>
        <div className="label">{label}</div>
        <div className={`value ${isOver ? 'over' : ''}`}>{fmt(value)}</div>
        <div className="hint">{hint}</div>
        {barHtml}
      </div>
    );
  };

  return (
    <div>
      {/* Summary Stat Cards */}
      <div className="summary-row" id="summaryRow">
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
      <div className="card pad" style={{ marginBottom: '18px' }}>
        <div className="sec-head">
          <span className="sec-title">By category — this month</span>
        </div>
        <div id="catBreakdown">
          {monthTotal === 0 ? (
            <div className="empty">
              <div className="big">🌱</div>
              <p>No expenses logged this month yet.</p>
            </div>
          ) : (
            CATEGORIES.map((c) => {
              const amt = byCat[c.id] || 0;
              const fillPct = (amt / maxCat) * 100;
              return (
                <div className="cat-row" key={c.id}>
                  <span className="cat-dot" style={{ backgroundColor: c.color }} />
                  <span className="cat-name">
                    {c.icon} {c.name}
                  </span>
                  <span className="cat-bar-track">
                    <span
                      className="cat-bar-fill"
                      style={{
                        width: `${fillPct}%`,
                        backgroundColor: c.color,
                      }}
                    />
                  </span>
                  <span className="cat-amt">{fmt(amt)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Entries */}
      <div className="card pad">
        <div className="sec-head">
          <span className="sec-title">Recent entries</span>
          <button className="sec-link" id="viewAllBtn" onClick={onNavigateToHistory}>
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
                <div className="entry" key={e.id}>
                  <span className="swatch" style={{ backgroundColor: `${c.color}22` }}>
                    {c.icon}
                  </span>
                  <span className="meta">
                    <div className="note">{e.note ? e.note : c.name}</div>
                    <div className="cat">
                      {c.name} · {dateLabel}
                    </div>
                  </span>
                  <span className="amt">{fmt(e.amount)}</span>
                  <button
                    className="del"
                    data-id={e.id}
                    title="Delete"
                    onClick={() => onDeleteEntry(e.id)}
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
            <div className="empty">
              <div className="big">🧾</div>
              <p>Nothing yet — tap + to add your first expense.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
