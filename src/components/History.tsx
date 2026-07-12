import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { deleteExpense } from '../store/ledgerSlice';
import {
  CAT_MAP,
  CATEGORIES,
  fmt,
  dkey,
  endOfMonth,
} from '../constants';

export const History: React.FC = () => {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((state) => state.ledger.entries);

  const today = new Date();
  const todayKey = dkey(today);

  // States localized to the History view
  const [calCursor, setCalCursor] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState<string>(todayKey);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCalCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Generate calendar grid contents
  const monthLabel = calCursor.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const firstDayOfMonth = new Date(calCursor.getFullYear(), calCursor.getMonth(), 1);
  // Get offset (0=Mon, 1=Tue, ..., 6=Sun)
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = endOfMonth(calCursor).getDate();

  // Accumulate totals by day key
  const totalsByDay = entries.reduce((acc, e) => {
    acc[e.date] = (acc[e.date] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const dowLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const daysGrid: React.ReactNode[] = [];

  // Add empty placeholders for offsets
  for (let i = 0; i < startOffset; i++) {
    daysGrid.push(<div className="bg-transparent pointer-events-none w-full aspect-square" key={`empty-${i}`} />);
  }

  // Add month days
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDayDate = new Date(calCursor.getFullYear(), calCursor.getMonth(), day);
    const key = dkey(currentDayDate);
    const amt = totalsByDay[key] || 0;

    const isSelected = key === selectedDay;
    const isToday = key === todayKey;
    const hasSpend = amt > 0;

    const dayClass = `aspect-square rounded-sm border border-transparent flex flex-col items-center justify-center gap-0.5 text-xs relative transition duration-150 ease-in-out w-full cursor-pointer ${
      isSelected 
        ? 'bg-accent text-white' 
        : hasSpend 
          ? 'bg-accent-soft text-ink hover:border-accent' 
          : 'bg-bg-sunken text-ink hover:border-accent'
    } ${
      isToday ? 'outline outline-2 outline-accent outline-offset-[-2px]' : ''
    }`;

    daysGrid.push(
      <button
        type="button"
        key={`day-${day}`}
        className={dayClass}
        onClick={() => setSelectedDay(key)}
      >
        <span className="font-semibold">{day}</span>
        {amt > 0 && (
          <span className={`text-[9px] font-mono ${isSelected ? 'text-[rgba(255,255,255,0.85)]' : 'text-ink-soft'}`}>
            {fmt(amt)}
          </span>
        )}
      </button>
    );
  }

  // Selected Day Panel details
  const parsedSelectedDate = new Date(selectedDay + 'T00:00:00');
  const dayPanelTitle =
    selectedDay === todayKey
      ? `Today · ${parsedSelectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : parsedSelectedDate.toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

  const dayEntries = entries
    .filter((e) => e.date === selectedDay)
    .sort((a, b) => b.id.localeCompare(a.id));

  const dayTotal = dayEntries.reduce((acc, e) => acc + e.amount, 0);

  const handleDelete = (id: string) => {
    dispatch(deleteExpense(id));
  };

  return (
    <div>
      {/* Calendar Grid Container */}
      <div className="bg-bg-elev border border-line rounded-custom p-6 shadow-custom">
        <div className="flex items-center justify-between mb-3.5">
          <button 
            className="w-[38px] h-[38px] rounded-full border border-line bg-bg-elev flex items-center justify-center text-ink-soft hover:border-accent hover:text-accent transition duration-150 ease-in-out cursor-pointer" 
            id="prevMonth" 
            onClick={handlePrevMonth} 
            aria-label="Previous month"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="font-display text-base font-semibold text-ink" id="monthLabel">
            {monthLabel}
          </span>
          <button 
            className="w-[38px] h-[38px] rounded-full border border-line bg-bg-elev flex items-center justify-center text-ink-soft hover:border-accent hover:text-accent transition duration-150 ease-in-out cursor-pointer" 
            id="nextMonth" 
            onClick={handleNextMonth} 
            aria-label="Next month"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.25" id="calGrid">
          {/* Day of Week headers */}
          {dowLabels.map((d) => (
            <div className="text-center text-[10px] text-ink-faint font-semibold uppercase pb-1 tracking-[0.05em]" key={d}>
              {d}
            </div>
          ))}
          {/* Day elements */}
          {daysGrid}
        </div>
      </div>

      {/* Selected Day Entries Panel */}
      <div className="bg-bg-elev border border-line rounded-custom p-6 shadow-custom mt-4.5">
        <div className="flex items-baseline justify-between mb-3.5">
          <span className="font-display text-lg font-semibold text-ink" id="dayPanelTitle">
            {dayPanelTitle}
          </span>
          <span className="text-ink-faint text-[13px] font-mono" id="dayPanelTotal">
            {dayEntries.length > 0 ? fmt(dayTotal) : ''}
          </span>
        </div>
        <div id="dayEntries">
          {dayEntries.length ? (
            dayEntries.map((e) => {
              const c = CAT_MAP[e.category] || CATEGORIES[0];
              const dateLabel = new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              });
              return (
                <div className="flex items-center gap-3.5 py-3.25 border-b border-line last:border-b-0 group" key={e.id}>
                  <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-base shrink-0" style={{ backgroundColor: `${c.color}22` }}>
                    {c.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{e.note ? e.note : c.name}</div>
                    <div className="text-xs text-ink-faint mt-0.5">
                      {c.name} · {dateLabel}
                    </div>
                  </span>
                  <span className="font-mono text-sm font-semibold text-ink shrink-0">{fmt(e.amount)}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition duration-150 ease-in-out w-6.5 h-6.5 rounded-full border-none bg-transparent text-ink-faint flex items-center justify-center hover:text-bad hover:bg-bg-sunken cursor-pointer focus:opacity-100 outline-none"
                    title="Delete"
                    onClick={() => handleDelete(e.id)}
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
            <div className="text-center p-[40px_20px] text-ink-faint">
              <div className="text-[32px] mb-2.5">📭</div>
              <p className="text-[13px] text-ink-soft">No expenses on this date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
