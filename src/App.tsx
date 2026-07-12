import { useState, useEffect } from 'react';
import { useAppDispatch } from './store';
import type { Tab } from './types';
import { LS_THEME } from './constants';
import { useAuth } from './hooks/useAuth';
import { useLedger } from './hooks/useLedger';
import { syncGoogleDriveData, uploadBackupToDrive } from './store/ledgerSlice';

import { Toast } from './components/Toast';
import { AddExpenseModal } from './components/AddExpenseModal';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { Reports } from './components/Reports';
import { CapsConfig } from './components/Caps';
import { ProfileDropdown } from './components/ProfileDropdown';
import { Button } from './components/ui/Button';

// Theme SVG Path Constants
const sunPath = 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42';
const moonPath = 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z';

function App() {
  const dispatch = useAppDispatch();
  const auth = useAuth();
  const ledger = useLedger();

  const { credentials, sync, actions } = auth;
  const { entries, caps } = ledger;

  const { accessToken, status: authStatus, user } = credentials;
  const { status: syncStatus, gdriveFileId, lastSynced, error: syncError } = sync;
  const { connect, disconnect, forceBackup } = actions;

  // --- Local UI States ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem(LS_THEME);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const [toastMsg, setToastMsg] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // --- Effects ---
  // Theme management
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);

  // Google Drive Initial Sync Setup (Runs on successful Login)
  useEffect(() => {
    if (accessToken) {
      dispatch(syncGoogleDriveData(accessToken));
    }
  }, [accessToken, dispatch]);

  // Debounced Background Auto-Sync
  useEffect(() => {
    if (!accessToken || !gdriveFileId || syncStatus === 'syncing') return;
    if (syncStatus !== 'idle') return;

    const syncTimer = setTimeout(() => {
      dispatch(uploadBackupToDrive({ accessToken }));
    }, 1500);

    return () => clearTimeout(syncTimer);
  }, [entries, caps, accessToken, gdriveFileId, syncStatus, dispatch]);

  // Online connection restoration auto-sync listener
  useEffect(() => {
    const handleOnline = () => {
      if (accessToken && gdriveFileId) {
        showToast('Connection restored. Syncing...');
        dispatch(uploadBackupToDrive({ accessToken, force: true }));
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [accessToken, gdriveFileId, dispatch]);

  // --- Actions & Helpers ---
  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="max-w-[980px] mx-auto px-5">
      {/* Brand Header */}
      <header className="flex items-center justify-between py-6 border-b border-line mb-6">
        <div className="flex items-baseline gap-2.5">
          <span className="font-display text-[26px] font-semibold tracking-[-0.02em] text-ink">ExpsTrck</span>
          <span className="text-xs text-ink-faint tracking-[0.06em] uppercase">expense tracker</span>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-2.5 relative">
          {/* Theme Toggler */}
          <Button 
            variant="icon"
            id="themeToggle" 
            title="Toggle theme" 
            onClick={handleToggleTheme}
          >
            <svg id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
              <path d={theme === 'dark' ? moonPath : sunPath} />
            </svg>
          </Button>

          {/* User Profile Button */}
          <button 
            className="w-[38px] h-[38px] rounded-full border bg-bg-elev flex items-center justify-center text-ink-soft hover:border-accent hover:text-accent transition duration-150 ease-in-out cursor-pointer overflow-hidden p-0" 
            id="profileToggle" 
            title="Google Profile & Sync"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{ 
              border: authStatus === 'authenticated' ? '1px solid var(--color-accent)' : '1px solid var(--color-line)' 
            }}
          >
            {authStatus === 'authenticated' && user ? (
              <img 
                src={user.picture} 
                alt={user.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                <path d="M20 21v-2a4 4 0 00-3-3.87M4 21v-2a4 4 0 013-3.87M12 11a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
            )}
          </button>

          {/* Close Menu Backdrop Overlay */}
          {isProfileOpen && (
            <div 
              className="fixed inset-0 z-90 cursor-default"
              onClick={() => setIsProfileOpen(false)} 
            />
          )}

          {/* Connection Profile Menu Card */}
          {isProfileOpen && (
            <ProfileDropdown
              authStatus={authStatus}
              user={user}
              syncStatus={syncStatus}
              lastSynced={lastSynced}
              syncError={syncError}
              onConnect={() => connect(showToast)}
              onDisconnect={() => disconnect(showToast)}
              onForceBackup={() => forceBackup(showToast)}
              onClose={() => setIsProfileOpen(false)}
            />
          )}
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="flex gap-1 my-5 border-b border-line overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(['dashboard', 'history', 'reports', 'caps'] as const).map((tab) => (
          <button
            key={tab}
            className={`bg-transparent border-b-2 px-4 pb-3 pt-2.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition duration-150 ease-in-out ${
              currentTab === tab ? 'text-ink border-b-accent' : 'text-ink-faint border-b-transparent hover:text-ink'
            }`}
            onClick={() => setCurrentTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {/* Dynamic Views */}
      <main className="animate-fade">
        {currentTab === 'dashboard' && (
          <Dashboard onNavigateToHistory={() => setCurrentTab('history')} />
        )}

        {currentTab === 'history' && (
          <History />
        )}

        {currentTab === 'reports' && (
          <Reports />
        )}

        {currentTab === 'caps' && (
          <CapsConfig />
        )}
      </main>

      {/* Floating Add Expense Action Trigger */}
      <button 
        className="fixed bottom-6 right-6 w-[58px] h-[58px] rounded-full bg-accent text-white border-none shadow-[0_8px_24px_rgba(0,0,0,0.25)] flex items-center justify-center z-50 hover:scale-106 transition duration-200 ease-in-out cursor-pointer" 
        id="addFab" 
        onClick={() => setIsModalOpen(true)} 
        aria-label="Add new expense"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Expense Modal Overlay */}
      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        showToast={showToast}
      />

      {/* Toast Alerts */}
      <Toast message={toastMsg} onClear={() => setToastMsg('')} />
    </div>
  );
}

export default App;
