import { useState, useEffect } from 'react';
import type { Expense, Caps, Tab } from './types';
import {
  CATEGORIES,
  LS_ENTRIES,
  LS_CAPS,
  LS_THEME,
} from './constants';

import { Toast } from './components/Toast';
import { AddExpenseModal } from './components/AddExpenseModal';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { Reports } from './components/Reports';
import { CapsConfig } from './components/Caps';

// Theme SVG Path Constants
const sunPath = 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42';
const moonPath = 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z';

function App() {
  // --- States ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem(LS_THEME);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');

  const [entries, setEntries] = useState<Expense[]>(() => {
    try {
      const stored = localStorage.getItem(LS_ENTRIES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [caps, setCaps] = useState<Caps>(() => {
    let raw: Caps = {};
    try {
      const stored = localStorage.getItem(LS_CAPS);
      if (stored) raw = JSON.parse(stored);
    } catch {
      raw = {};
    }
    // Set defaults for categories that are missing
    CATEGORIES.forEach((c) => {
      if (!raw[c.id]) {
        raw[c.id] = { weekly: 0, monthly: 0 };
      }
    });
    return raw;
  });

  const [toastMsg, setToastMsg] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // --- Effects ---
  // Apply theme class to document body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);

  // --- Actions ---
  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const handleSaveEntry = (amount: number, category: string, date: string, note: string) => {
    const newEntry: Expense = {
      id: Date.now() + Math.random().toString(16).slice(2),
      amount,
      category,
      date,
      note,
    };
    const updated = [...entries, newEntry];
    setEntries(updated);
    localStorage.setItem(LS_ENTRIES, JSON.stringify(updated));
    showToast('Expense added');
  };

  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem(LS_ENTRIES, JSON.stringify(updated));
    showToast('Deleted');
  };

  const handleUpdateCap = (categoryId: string, period: 'weekly' | 'monthly', value: number) => {
    const updatedCaps = {
      ...caps,
      [categoryId]: {
        ...caps[categoryId],
        [period]: value,
      },
    };
    setCaps(updatedCaps);
    localStorage.setItem(LS_CAPS, JSON.stringify(updatedCaps));
    showToast('Cap updated');
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="wrap">
      {/* Brand Header */}
      <header className="top">
        <div className="brand">
          <span className="mark">Ledger</span>
          <span className="sub">expense tracker</span>
        </div>
        <div className="top-actions">
          <button className="icon-btn" id="themeToggle" title="Toggle theme" onClick={handleToggleTheme}>
            <svg id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={theme === 'dark' ? moonPath : sunPath} />
            </svg>
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="tabs">
        <button
          className={`tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab-btn ${currentTab === 'history' ? 'active' : ''}`}
          onClick={() => setCurrentTab('history')}
        >
          History
        </button>
        <button
          className={`tab-btn ${currentTab === 'reports' ? 'active' : ''}`}
          onClick={() => setCurrentTab('reports')}
        >
          Reports
        </button>
        <button
          className={`tab-btn ${currentTab === 'caps' ? 'active' : ''}`}
          onClick={() => setCurrentTab('caps')}
        >
          Caps
        </button>
      </nav>

      {/* Dynamic Views */}
      {currentTab === 'dashboard' && (
        <section className="view active" id="view-dashboard">
          <Dashboard
            entries={entries}
            caps={caps}
            onDeleteEntry={handleDeleteEntry}
            onNavigateToHistory={() => setCurrentTab('history')}
          />
        </section>
      )}

      {currentTab === 'history' && (
        <section className="view active" id="view-history">
          <History entries={entries} onDeleteEntry={handleDeleteEntry} />
        </section>
      )}

      {currentTab === 'reports' && (
        <section className="view active" id="view-reports">
          <Reports entries={entries} />
        </section>
      )}

      {currentTab === 'caps' && (
        <section className="view active" id="view-caps">
          <CapsConfig caps={caps} onUpdateCap={handleUpdateCap} />
        </section>
      )}

      {/* Floating Add Expense Action Trigger */}
      <button className="fab" id="addFab" onClick={() => setIsModalOpen(true)} aria-label="Add new expense">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Expense Modal Overlay */}
      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEntry}
        showToast={showToast}
      />

      {/* Toast Alerts */}
      <Toast message={toastMsg} onClear={() => setToastMsg('')} />
    </div>
  );
}

export default App;
