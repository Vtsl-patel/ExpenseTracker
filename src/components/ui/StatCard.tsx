import React from 'react';
import { fmt } from '../../constants';

interface StatCardProps {
  label: string;
  value: number | string;
  cap?: number;
  hint: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, cap = 0, hint }) => {
  const isOver = cap > 0 && typeof value === 'number' && value > cap;
  let barHtml = null;

  if (cap > 0 && typeof value === 'number') {
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

  const displayValue = typeof value === 'number' ? fmt(value) : value;

  return (
    <div className="flex-1 min-w-[150px] card p-[18px_20px] shadow-custom">
      <div className="text-[11px] uppercase tracking-[0.07em] text-ink-faint mb-2">{label}</div>
      <div className={`font-display text-[28px] font-semibold tracking-[-0.01em] ${isOver ? 'text-bad' : 'text-ink'}`}>
        {displayValue}
      </div>
      <div className="text-xs text-ink-faint mt-1.5">{hint}</div>
      {barHtml}
    </div>
  );
};
