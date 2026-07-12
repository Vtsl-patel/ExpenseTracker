import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { updateCap } from '../store/ledgerSlice';
import { CATEGORIES } from '../constants';

export const CapsConfig: React.FC = () => {
  const dispatch = useAppDispatch();
  const caps = useAppSelector((state) => state.ledger.caps);
  const [activePeriod, setActivePeriod] = useState<'weekly' | 'monthly'>('monthly');

  const handleCapChange = (categoryId: string, valueStr: string) => {
    // Permit empty string or valid positive decimal number with up to 2 decimal places
    if (valueStr === '' || /^\d*\.?\d{0,2}$/.test(valueStr)) {
      const val = valueStr === '' ? 0 : parseFloat(valueStr);
      dispatch(updateCap({ categoryId, period: activePeriod, value: val }));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      
      {/* Budget Period Filter Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-bg-elev border border-line rounded-custom p-5 shadow-custom">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">Budget Limits</h3>
          <p className="text-ink-faint text-xs mt-1">Configure spending limits by category to manage your goals</p>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex bg-bg-sunken rounded-[10px] p-0.75 gap-0.5 w-full sm:w-[220px]">
          {(['weekly', 'monthly'] as const).map((period) => (
            <button
              key={period}
              type="button"
              className={`flex-1 border-none bg-transparent py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activePeriod === period 
                  ? 'bg-bg-elev text-ink shadow-custom' 
                  : 'text-ink-faint hover:text-ink'
              }`}
              onClick={() => setActivePeriod(period)}
            >
              {period === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIES.map((c) => {
          const cap = caps[c.id] || { weekly: 0, monthly: 0 };
          const currentValue = activePeriod === 'weekly' ? cap.weekly : cap.monthly;
          // Set display value as empty string if it's 0 to let user type easily
          const displayValue = currentValue === 0 ? '' : currentValue.toString();

          return (
            <div 
              key={c.id} 
              className="bg-bg-elev border border-line rounded-custom p-5 shadow-custom flex items-center justify-between gap-4 transition hover:border-ink-faint duration-200"
            >
              {/* Category Identity Info */}
              <div className="flex items-center gap-3">
                <span 
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg shrink-0" 
                  style={{ backgroundColor: `${c.color}18` }}
                >
                  {c.icon}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-ink">{c.name}</h4>
                  <p className="text-[11px] text-ink-faint mt-0.5">
                    {currentValue > 0 ? `Budget: ₹${currentValue}` : 'No threshold set'}
                  </p>
                </div>
              </div>

              {/* Single Input Field for Current Period */}
              <div className="w-[120px] shrink-0">
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-semibold text-ink-faint">₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={displayValue}
                    onChange={(e) => handleCapChange(c.id, e.target.value)}
                    className="w-full pl-6 pr-3 py-2 border border-line rounded-[10px] bg-bg-sunken text-ink text-sm font-semibold outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent focus:bg-bg-elev transition-all duration-150 ease-in-out text-right shadow-sm"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-ink-faint text-[13px] leading-relaxed">
        Budgets reset automatically each calendar {activePeriod === 'weekly' ? 'week' : 'month'}. Set 0 or leave empty to disable limits on a category.
      </p>
    </div>
  );
};

export default CapsConfig;
