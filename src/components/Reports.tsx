import React, { useState, useMemo } from 'react';
import type { Expense, ReportMode } from '../types';
import {
  CATEGORIES,
  CAT_MAP,
  fmt,
  startOfMonth,
  endOfMonth,
  entriesBetween,
  sum,
  dkey,
} from '../constants';

interface ReportsProps {
  entries: Expense[];
}

export const Reports: React.FC<ReportsProps> = ({ entries }) => {
  const now = new Date();
  const defaultFrom = dkey(startOfMonth(now));
  const defaultTo = dkey(endOfMonth(now));

  const [reportMode, setReportMode] = useState<ReportMode>('monthly');
  const [rangeFrom, setRangeFrom] = useState<string>(defaultFrom);
  const [rangeTo, setRangeTo] = useState<string>(defaultTo);

  // Store applied custom range dates to avoid re-calculating on every keystroke
  const [appliedRange, setAppliedRange] = useState<{ from: string; to: string }>({
    from: defaultFrom,
    to: defaultTo,
  });

  const handleApplyRange = () => {
    if (rangeFrom && rangeTo) {
      setAppliedRange({ from: rangeFrom, to: rangeTo });
    }
  };

  // Compute active date range [from, to, label]
  const [fromDate, toDate, rangeLabel] = useMemo((): [Date, Date, string] => {
    if (reportMode === 'monthly') {
      return [startOfMonth(now), endOfMonth(now), 'This month'];
    }
    if (reportMode === 'quarterly') {
      const q = Math.floor(now.getMonth() / 3);
      const from = new Date(now.getFullYear(), q * 3, 1);
      const to = new Date(now.getFullYear(), q * 3 + 3, 0);
      return [from, to, `Q${q + 1} ${now.getFullYear()}`];
    }
    if (reportMode === 'yearly') {
      return [
        new Date(now.getFullYear(), 0, 1),
        new Date(now.getFullYear(), 11, 31),
        `${now.getFullYear()}`,
      ];
    }
    // Custom range
    const from = new Date(appliedRange.from + 'T00:00:00');
    const to = new Date(appliedRange.to + 'T00:00:00');
    return [from, to, `${appliedRange.from} → ${appliedRange.to}`];
  }, [reportMode, appliedRange, now]);

  // Calculations based on calculated range
  const filteredEntries = useMemo(() => {
    return entriesBetween(entries, fromDate, toDate);
  }, [entries, fromDate, toDate]);

  const totalSpend = useMemo(() => {
    return sum(filteredEntries);
  }, [filteredEntries]);

  const daysInRange = useMemo(() => {
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  }, [fromDate, toDate]);

  const dailyAverage = totalSpend / daysInRange;

  // Compute breakdown by category
  const categoryTotals = useMemo(() => {
    const totals = CATEGORIES.reduce((acc, c) => {
      acc[c.id] = 0;
      return acc;
    }, {} as Record<string, number>);

    filteredEntries.forEach((e) => {
      if (totals[e.category] !== undefined) {
        totals[e.category] += e.amount;
      }
    });
    return totals;
  }, [filteredEntries]);

  const maxCategorySpend = useMemo(() => {
    return Math.max(...Object.values(categoryTotals), 1);
  }, [categoryTotals]);

  // Compute top category label
  const topCategoryLabel = useMemo(() => {
    if (!filteredEntries.length) return '—';
    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topId = sorted[0]?.[0];
    const topVal = sorted[0]?.[1];
    if (topId && topVal > 0) {
      const cat = CAT_MAP[topId];
      return `${cat?.icon || ''} ${cat?.name || ''}`;
    }
    return '—';
  }, [filteredEntries, categoryTotals]);

  const renderStatCard = (label: string, valueStr: string, hint: string) => {
    return (
      <div className="stat" key={label}>
        <div className="label">{label}</div>
        <div className="value">{valueStr}</div>
        <div className="hint">{hint}</div>
      </div>
    );
  };

  return (
    <div className="card pad">
      {/* Segmented Period Switcher */}
      <div className="seg" id="reportSeg">
        {(['monthly', 'quarterly', 'yearly', 'range'] as ReportMode[]).map((mode) => (
          <button
            key={mode}
            className={reportMode === mode ? 'active' : ''}
            onClick={() => setReportMode(mode)}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Date picker inputs for Custom Range */}
      {reportMode === 'range' && (
        <div id="rangePick" className="range-pick">
          <div className="field">
            <label htmlFor="rangeFrom">From</label>
            <input
              id="rangeFrom"
              type="date"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="rangeTo">To</label>
            <input
              id="rangeTo"
              type="date"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" id="applyRange" onClick={handleApplyRange}>
            Apply
          </button>
        </div>
      )}

      {/* Summaries Row */}
      <div className="summary-row" id="reportSummary">
        {renderStatCard(
          rangeLabel,
          fmt(totalSpend),
          `${filteredEntries.length} ${filteredEntries.length === 1 ? 'entry' : 'entries'}`
        )}
        {renderStatCard(
          'Daily average',
          fmt(dailyAverage),
          `over ${daysInRange} day${daysInRange > 1 ? 's' : ''}`
        )}
        {renderStatCard('Top category', topCategoryLabel, '')}
      </div>

      {/* Category Breakdown Bars */}
      <div className="sec-head">
        <span className="sec-title">Category breakdown</span>
      </div>

      <div id="reportBars">
        {totalSpend === 0 ? (
          <div className="empty">
            <div className="big">📊</div>
            <p>No expenses in this range.</p>
          </div>
        ) : (
          <>
            {CATEGORIES.map((c) => {
              const amt = categoryTotals[c.id] || 0;
              const fillPct = (amt / maxCategorySpend) * 100;
              return (
                <div className="bar-row" key={c.id}>
                  <span className="name">
                    {c.icon} {c.name}
                  </span>
                  <span className="track">
                    <span
                      className="fill"
                      style={{
                        width: `${fillPct}%`,
                        backgroundColor: c.color,
                      }}
                    />
                  </span>
                  <span className="amt">{fmt(amt)}</span>
                </div>
              );
            })}

            {/* Percentage Legend */}
            <div className="legend">
              {CATEGORIES.map((c) => {
                const amt = categoryTotals[c.id] || 0;
                const percentage = totalSpend > 0 ? Math.round((amt / totalSpend) * 100) : 0;
                return (
                  <span className="li" key={c.id}>
                    <span className="cat-dot" style={{ backgroundColor: c.color }} />
                    {c.name} · {percentage}%
                  </span>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
