import React from 'react';
import type { Caps } from '../types';
import { CATEGORIES } from '../constants';

interface CapsProps {
  caps: Caps;
  onUpdateCap: (categoryId: string, period: 'weekly' | 'monthly', value: number) => void;
}

export const CapsConfig: React.FC<CapsProps> = ({ caps, onUpdateCap }) => {
  return (
    <div>
      <div className="card">
        <div id="capsList">
          {CATEGORIES.map((c) => {
            const cap = caps[c.id] || { weekly: 0, monthly: 0 };
            return (
              <div className="cap-card" key={c.id}>
                <div className="cap-top">
                  <span className="nm">
                    <span className="cat-dot" style={{ backgroundColor: c.color }} />
                    {c.icon} {c.name}
                  </span>
                </div>
                <div className="cap-inputs">
                  <div className="field">
                    <label htmlFor={`cap-weekly-${c.id}`}>Weekly cap</label>
                    <input
                      id={`cap-weekly-${c.id}`}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={cap.weekly || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onUpdateCap(c.id, 'weekly', val);
                      }}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`cap-monthly-${c.id}`}>Monthly cap</label>
                    <input
                      id={`cap-monthly-${c.id}`}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={cap.monthly || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onUpdateCap(c.id, 'monthly', val);
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="muted" style={{ marginTop: '14px' }}>
        Caps reset automatically each calendar month / week. Set 0 to leave a category uncapped.
      </p>
    </div>
  );
};
