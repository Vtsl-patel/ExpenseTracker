import React from 'react';
import type { Expense } from '../types';
import { fmt, CAT_MAP } from '../constants';

interface EntryRowProps {
  entry: Expense;
  onDelete: (id: string) => void;
}

export const EntryRow: React.FC<EntryRowProps> = ({ entry, onDelete }) => {
  const catObj = CAT_MAP[entry.category] || { name: entry.category, icon: '🏷️', color: 'var(--color-line)' };

  return (
    <div className="flex items-center justify-between py-3.5 border-b border-line/45 last:border-0 transition-all hover:bg-bg-sunken/10 px-1 rounded-sm">
      <div className="flex items-center gap-3 min-w-0">
        <span 
          className="w-8.5 h-8.5 rounded-lg flex items-center justify-center text-base shrink-0" 
          style={{ backgroundColor: `${catObj.color}15` }}
        >
          {catObj.icon}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink truncate">
            {entry.note || catObj.name}
          </div>
          <div className="text-[10px] text-ink-faint mt-0.5 uppercase tracking-wide">
            {catObj.name}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-ink font-mono">{fmt(entry.amount)}</span>
        <button
          onClick={() => onDelete(entry.id)}
          className="w-7 h-7 rounded-full bg-transparent border-none text-ink-faint hover:text-bad flex items-center justify-center transition cursor-pointer"
          title="Delete entry"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
};
