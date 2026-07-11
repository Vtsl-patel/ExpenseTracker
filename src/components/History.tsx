import React, { useState } from 'react';
import type { Expense } from '../types';
import {
  CAT_MAP,
  CATEGORIES,
  fmt,
  dkey,
  endOfMonth,
} from '../constants';

interface HistoryProps {
  entries: Expense[];
  onDeleteEntry: (id: string) => void;
}

export const History: React.FC<HistoryProps> = ({ entries, onDeleteEntry }) => {
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
    daysGrid.push(<div className="cal-day empty" key={`empty-${i}`} />);
  }

  // Add month days
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDayDate = new Date(calCursor.getFullYear(), calCursor.getMonth(), day);
    const key = dkey(currentDayDate);
    const amt = totalsByDay[key] || 0;

    const classes: string[] = ['cal-day'];
    if (amt > 0) classes.push('has-spend');
    if (key === todayKey) classes.push('today');
    if (key === selectedDay) classes.push('selected');

    daysGrid.push(
      <button
        type="button"
        key={`day-${day}`}
        className={classes.join(' ')}
        onClick={() => setSelectedDay(key)}
      >
        <span className="d">{day}</span>
        {amt > 0 && <span className="amt">{fmt(amt)}</span>}
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

  return (
    <div>
      {/* Calendar Grid Container */}
      <div className="card pad">
        <div className="cal-head">
          <button className="icon-btn" id="prevMonth" onClick={handlePrevMonth} aria-label="Previous month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="month-label" id="monthLabel">
            {monthLabel}
          </span>
          <button className="icon-btn" id="nextMonth" onClick={handleNextMonth} aria-label="Next month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="cal-grid" id="calGrid">
          {/* Day of Week headers */}
          {dowLabels.map((d) => (
            <div className="cal-dow" key={d}>
              {d}
            </div>
          ))}
          {/* Day elements */}
          {daysGrid}
        </div>
      </div>

      {/* Selected Day Entries Panel */}
      <div className="card pad daypanel">
        <div className="sec-head">
          <span className="sec-title" id="dayPanelTitle">
            {dayPanelTitle}
          </span>
          <span className="muted" id="dayPanelTotal">
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
                <div className="entry" key={e.id}>
                  <span className="swatch" style={{ backgroundColor: `${c.color}22` }}>
                    {c.icon}
                  </span>
                  <span className="meta">
                    <div className="note">{e.note ? e.note : c.name}</div>
                    <div className="cat">
                      {c.name} · {dateLabel}
                    </div>
                  </span>
                  <span className="amt">{fmt(e.amount)}</span>
                  <button
                    className="del"
                    title="Delete"
                    onClick={() => onDeleteEntry(e.id)}
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
            <div className="empty">
              <div className="big">📭</div>
              <p>No expenses on this date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
