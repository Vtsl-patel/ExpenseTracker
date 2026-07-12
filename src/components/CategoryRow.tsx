import React from 'react';
import type { Category } from '../types';
import { fmt } from '../constants';

interface CategoryRowProps {
  category: Category;
  amount: number;
  maxAmount: number;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({ category, amount, maxAmount }) => {
  const pct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 py-3 border-b border-line/40 last:border-0">
      <div className="flex justify-between items-center text-sm font-semibold">
        <div className="flex items-center gap-2">
          <span>{category.icon}</span>
          <span className="text-ink">{category.name}</span>
        </div>
        <span className="text-ink font-mono">{fmt(amount)}</span>
      </div>
      <div className="h-2 rounded-full bg-bg-sunken overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${pct}%`,
            backgroundColor: category.color
          }}
        />
      </div>
    </div>
  );
};
