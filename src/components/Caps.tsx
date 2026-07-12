import React, { useState } from 'react';
import { CATEGORIES } from '../constants';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { useLedger } from '../hooks/useLedger';

export const CapsConfig: React.FC = () => {
  const ledger = useLedger();
  const { caps, actions } = ledger;
  const { updateCap } = actions;
  const [activePeriod, setActivePeriod] = useState<'weekly' | 'monthly'>('monthly');

  const handleCapChange = (categoryId: string, valueStr: string) => {
    // Permit empty string or valid positive decimal number with up to 2 decimal places
    if (valueStr === '' || /^\d*\.?\d{0,2}$/.test(valueStr)) {
      const val = valueStr === '' ? 0 : parseFloat(valueStr);
      updateCap(categoryId, activePeriod, val);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      
      {/* Budget Period Filter Card */}
      <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5">
        <div>
          <h3 className="sec-title">Budget Limits</h3>
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
      </Card>

      {/* Grid of Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIES.map((c) => {
          const cap = caps[c.id] || { weekly: 0, monthly: 0 };
          const currentValue = activePeriod === 'weekly' ? cap.weekly : cap.monthly;
          const displayValue = currentValue === 0 ? '' : currentValue.toString();

          return (
            <Card 
              key={c.id} 
              className="flex items-center justify-between gap-4 p-5 transition hover:border-ink-faint duration-200"
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
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={displayValue}
                onChange={(e) => handleCapChange(c.id, e.target.value)}
                currency
                className="w-[120px] shrink-0"
              />
            </Card>
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
