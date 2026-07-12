import React, { useState, useRef, useEffect } from 'react';
import { endOfMonth, dkey } from '../constants';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  id?: string;
  align?: 'top' | 'bottom';
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, id, align = 'bottom' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [calCursor, setCalCursor] = useState<Date>(() => {
    return value ? new Date(value + 'T00:00:00') : new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync cursor when value changes
  useEffect(() => {
    if (value) {
      setCalCursor(new Date(value + 'T00:00:00'));
    }
  }, [value]);

  // Click away listener to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCalCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCalCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDaySelect = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(key);
    setIsOpen(false);
  };

  // Generate calendar grid
  const monthLabel = calCursor.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });

  const firstDayOfMonth = new Date(calCursor.getFullYear(), calCursor.getMonth(), 1);
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // Mon = 0
  const daysInMonth = endOfMonth(calCursor).getDate();
  const dowLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const daysGrid: React.ReactNode[] = [];
  for (let i = 0; i < startOffset; i++) {
    daysGrid.push(<div key={`empty-${i}`} className="w-full aspect-square bg-transparent" />);
  }

  const todayKey = dkey(new Date());

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDayDate = new Date(calCursor.getFullYear(), calCursor.getMonth(), day);
    const key = dkey(currentDayDate);
    const isSelected = key === value;
    const isToday = key === todayKey;

    daysGrid.push(
      <button
        type="button"
        key={`day-${day}`}
        onClick={(e) => handleDaySelect(key, e)}
        className={`aspect-square rounded-sm text-xs font-semibold flex items-center justify-center cursor-pointer transition duration-150 border border-transparent ${
          isSelected 
            ? 'bg-accent text-white font-bold' 
            : 'bg-bg-sunken text-ink hover:border-accent'
        } ${
          isToday ? 'outline outline-2 outline-accent outline-offset-[-2px]' : ''
        }`}
      >
        {day}
      </button>
    );
  }

  // Display label
  const displayLabel = value 
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Select date';

  return (
    <div className="relative w-full" ref={containerRef} id={id}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-[14px] py-[11px] border border-line rounded-[10px] bg-bg-elev text-ink text-sm font-medium outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all duration-150 ease-in-out shadow-sm text-left cursor-pointer"
      >
        <span>{displayLabel}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-accent shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div className={`absolute left-0 w-[240px] bg-bg-elev border border-line rounded-lg shadow-custom p-3.5 z-50 animate-slideup flex flex-col gap-2.5 ${
          align === 'top' ? 'bottom-12' : 'top-12'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-6 h-6 rounded-full border border-line bg-bg-elev flex items-center justify-center text-ink-soft hover:text-accent cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="font-display text-xs font-semibold text-ink">{monthLabel}</span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-6 h-6 rounded-full border border-line bg-bg-elev flex items-center justify-center text-ink-soft hover:text-accent cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {dowLabels.map((d, idx) => (
              <div key={idx} className="text-center text-[9px] text-ink-faint font-semibold uppercase tracking-[0.02em] pb-1">
                {d}
              </div>
            ))}
            {daysGrid}
          </div>
        </div>
      )}
    </div>
  );
};
