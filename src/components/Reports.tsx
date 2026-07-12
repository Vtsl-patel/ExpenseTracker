import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../store';
import type { ReportMode } from '../types';
import { DatePicker } from './DatePicker';
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

export const Reports: React.FC = () => {
  // Fetch entries from Redux
  const entries = useAppSelector((state) => state.ledger.entries);

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
      <div className="flex-1 min-w-[150px] bg-bg-elev border border-line rounded-custom p-[18px_20px] shadow-custom" key={label}>
        <div className="text-[11px] uppercase tracking-[0.07em] text-ink-faint mb-2">{label}</div>
        <div className="font-display text-[28px] font-semibold tracking-[-0.01em] text-ink">{valueStr}</div>
        <div className="text-xs text-ink-faint mt-1.5">{hint}</div>
      </div>
    );
  };

  return (
    <div className="bg-bg-elev border border-line rounded-custom p-6 shadow-custom">
      {/* Segmented Period Switcher */}
      <div className="flex bg-bg-sunken rounded-[10px] p-0.75 gap-0.5 mb-4.5" id="reportSeg">
        {(['monthly', 'quarterly', 'yearly', 'range'] as ReportMode[]).map((mode) => (
          <button
            key={mode}
            className={`flex-1 border-none bg-transparent p-[9px_6px] rounded-lg text-[13px] font-semibold transition cursor-pointer ${
              reportMode === mode ? 'bg-bg-elev text-ink shadow-custom' : 'text-ink-faint hover:text-ink'
            }`}
            onClick={() => setReportMode(mode)}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Date picker inputs for Custom Range */}
      {reportMode === 'range' && (
        <div id="rangePick" className="flex gap-3.5 mb-5 items-end bg-bg-sunken border border-line rounded-[12px] p-4.5 shadow-inner">
          <div className="mb-0 flex-1">
            <label htmlFor="rangeFrom" className="block text-[11px] font-semibold text-ink-soft mb-1.5 tracking-[0.04em] uppercase">From</label>
            <DatePicker
              value={rangeFrom}
              onChange={setRangeFrom}
              id="rangeFrom"
            />
          </div>
          <div className="mb-0 flex-1">
            <label htmlFor="rangeTo" className="block text-[11px] font-semibold text-ink-soft mb-1.5 tracking-[0.04em] uppercase">To</label>
            <DatePicker
              value={rangeTo}
              onChange={setRangeTo}
              id="rangeTo"
            />
          </div>
          <button 
            className="inline-flex items-center justify-center gap-1.5 px-[20px] py-[11px] rounded-[10px] text-sm font-semibold transition duration-150 ease-in-out border border-transparent bg-accent text-white hover:brightness-108 cursor-pointer shadow-sm" 
            id="applyRange" 
            onClick={handleApplyRange}
          >
            Apply
          </button>
        </div>
      )}

      {/* Summaries Row */}
      <div className="flex gap-4.5 mb-4.5 flex-wrap" id="reportSummary">
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
      <div className="flex items-baseline justify-between mb-3.5 mt-6">
        <span className="font-display text-lg font-semibold text-ink">Category breakdown</span>
      </div>

      <div id="reportBars">
        {totalSpend === 0 ? (
          <div className="text-center p-[40px_20px] text-ink-faint">
            <div className="text-[32px] mb-2.5">📊</div>
            <p className="text-[13px] text-ink-soft">No expenses in this range.</p>
          </div>
        ) : (
          <>
            {CATEGORIES.map((c) => {
              const amt = categoryTotals[c.id] || 0;
              const fillPct = (amt / maxCategorySpend) * 100;
              return (
                <div className="flex items-center gap-3 py-2.5" key={c.id}>
                  <span className="w-[110px] text-[13px] text-ink-soft shrink-0">
                    {c.icon} {c.name}
                  </span>
                  <span className="flex-1 h-2.5 bg-bg-sunken rounded-full overflow-hidden">
                    <span
                      className="h-full rounded-full block"
                      style={{
                        width: `${fillPct}%`,
                        backgroundColor: c.color,
                      }}
                    />
                  </span>
                  <span className="w-[78px] text-right font-mono text-xs text-ink-soft shrink-0">{fmt(amt)}</span>
                </div>
              );
            })}

            {/* Percentage Legend */}
            <div className="flex flex-wrap gap-3.5 mt-6 border-t border-line pt-4">
              {CATEGORIES.map((c) => {
                const amt = categoryTotals[c.id] || 0;
                const percentage = totalSpend > 0 ? Math.round((amt / totalSpend) * 100) : 0;
                return (
                  <span className="flex items-center gap-1.5 text-xs text-ink-soft" key={c.id}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
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

export default Reports;
