import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { deleteExpense } from '../store/ledgerSlice';
import {
  fmt,
  dkey,
  endOfMonth,
} from '../constants';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { EntryRow } from './EntryRow';
import { EmptyState } from './ui/EmptyState';

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
    <div className="flex flex-col gap-4.5">
      {/* Calendar Grid Container */}
      <Card>
        <div className="flex items-center justify-between mb-3.5">
          <Button 
            variant="icon"
            id="prevMonth" 
            onClick={handlePrevMonth} 
            aria-label="Previous month"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Button>
          <span className="font-display text-base font-semibold text-ink" id="monthLabel">
            {monthLabel}
          </span>
          <Button 
            variant="icon"
            id="nextMonth" 
            onClick={handleNextMonth} 
            aria-label="Next month"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Button>
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
      </Card>

      {/* Selected Day Entries Panel */}
      <Card>
        <div className="flex items-baseline justify-between mb-3.5">
          <span className="sec-title" id="dayPanelTitle">
            {dayPanelTitle}
          </span>
          <span className="text-ink-faint text-[13px] font-mono" id="dayPanelTotal">
            {dayEntries.length > 0 ? fmt(dayTotal) : ''}
          </span>
        </div>
        <div id="dayEntries" className="flex flex-col">
          {dayEntries.length ? (
            dayEntries.map((e) => (
              <EntryRow 
                key={e.id}
                entry={e}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <EmptyState icon="📭" text="No expenses logged on this date." />
          )}
        </div>
      </Card>
    </div>
  );
};

export default History;
