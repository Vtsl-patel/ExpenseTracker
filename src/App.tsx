import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store';
import type { Tab } from './types';
import { LS_THEME } from './constants';
import { logout, loginWithAccessToken } from './store/authSlice';
import { syncGoogleDriveData, uploadBackupToDrive } from './store/ledgerSlice';

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
  const dispatch = useAppDispatch();

  // --- Redux Selectors ---
  const { clientId, accessToken, user, status: authStatus } = useAppSelector((state) => state.auth);
  const { entries, caps, gdriveFileId, syncStatus, lastSynced, error: syncError } = useAppSelector((state) => state.ledger);

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

  const handleConnectGoogle = () => {
    if (!clientId) {
      showToast('OAuth Client ID is missing. Set VITE_GOOGLE_CLIENT_ID in your .env file.');
      return;
    }
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            showToast('Google authentication failed');
            return;
          }

          const token = tokenResponse.access_token;
          dispatch(loginWithAccessToken(token))
            .unwrap()
            .then((res) => {
              showToast(`Connected as ${res.user.name}`);
            })
            .catch((err) => {
              showToast(err || 'Failed to authenticate Google profile');
            });
        },
      });
      client.requestAccessToken({ prompt: '' });
    } catch (err: any) {
      showToast('Client auth failed. Verify your Client ID.');
    }
  };

  const handleDisconnect = () => {
    dispatch(logout());
    showToast('Google Account disconnected');
  };

  const handleForceBackup = () => {
    if (!accessToken) return;
    dispatch(uploadBackupToDrive({ accessToken, force: true }))
      .unwrap()
      .then(() => {
        showToast('Backup completed successfully');
      })
      .catch((err) => {
        showToast(err || 'Manual backup failed');
      });
  };

  return (
    <div className="max-w-[980px] mx-auto px-5">
      {/* Brand Header */}
      <header className="flex items-center justify-between py-6 border-b border-line mb-6">
        <div className="flex items-baseline gap-2.5">
          <span className="font-display text-[26px] font-semibold tracking-[-0.02em] text-ink">Ledger</span>
          <span className="text-xs text-ink-faint tracking-[0.06em] uppercase">expense tracker</span>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-2.5 relative">
          {/* Theme Toggler */}
          <button 
            className="w-[38px] h-[38px] rounded-full border border-line bg-bg-elev flex items-center justify-center text-ink-soft hover:border-accent hover:text-accent transition duration-150 ease-in-out cursor-pointer" 
            id="themeToggle" 
            title="Toggle theme" 
            onClick={handleToggleTheme}
          >
            <svg id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
              <path d={theme === 'dark' ? moonPath : sunPath} />
            </svg>
          </button>

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
              style={{ position: 'fixed', inset: 0, zIndex: 90, cursor: 'default' }} 
              onClick={() => setIsProfileOpen(false)} 
            />
          )}

          {/* Connection Profile Menu Card */}
          {isProfileOpen && (
            <div className="absolute top-12 right-0 w-[280px] bg-bg-elev border border-line rounded-lg shadow-custom p-4 z-[95] animate-slideup flex flex-col gap-3 max-[480px]:-right-5">
              {authStatus === 'authenticated' && user ? (
                <div className="flex flex-col gap-3">
                  
                  {/* Avatar & Info */}
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-line">
                    <img 
                      src={user.picture} 
                      alt={user.name} 
                      className="w-9 h-9 rounded-full border border-line"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-ink truncate">{user.name}</div>
                      <div className="text-[11px] text-ink-faint truncate">{user.email}</div>
                    </div>
                  </div>

                  {/* Sync Status Details */}
                  <div className="text-[12px] flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-soft">Sync Status:</span>
                      <span 
                        className="font-semibold"
                        style={{ 
                          color: syncStatus === 'failed' ? 'var(--color-bad)' : 'var(--color-good)' 
                        }}
                      >
                        {syncStatus === 'syncing' && 'Syncing...'}
                        {syncStatus === 'synced' && 'Synced'}
                        {syncStatus === 'failed' && 'Failed'}
                        {syncStatus === 'idle' && 'Pending Sync'}
                      </span>
                    </div>
                    {lastSynced && (
                      <div className="flex items-center justify-between">
                        <span className="text-ink-soft">Last backup:</span>
                        <span className="text-ink-faint font-mono">{lastSynced}</span>
                      </div>
                    )}
                  </div>

                  {syncStatus === 'failed' && syncError && (
                    <div className="text-[10px] text-bad bg-bad/10 p-1.5 rounded-sm">
                      Error: {syncError}
                    </div>
                  )}

                  {/* Sync Actions */}
                  <div className="flex flex-col gap-2 mt-1">
                    <button 
                      className="w-full inline-flex items-center justify-center gap-1.5 px-[14px] py-[8px] rounded-sm text-xs font-semibold transition duration-150 ease-in-out border border-transparent bg-accent text-white hover:brightness-108 cursor-pointer" 
                      onClick={() => {
                        handleForceBackup();
                        setIsProfileOpen(false);
                      }}
                      disabled={syncStatus === 'syncing'}
                    >
                      Force Backup
                    </button>
                    <button 
                      className="w-full inline-flex items-center justify-center gap-1.5 px-[14px] py-[8px] rounded-sm text-xs font-semibold transition duration-150 ease-in-out border border-line bg-bg-sunken text-ink hover:border-accent hover:text-accent cursor-pointer text-bad hover:text-bad" 
                      onClick={() => {
                        handleDisconnect();
                        setIsProfileOpen(false);
                      }}
                    >
                      Disconnect Account
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 text-center">
                  <div className="text-sm font-semibold text-ink">Google Sync</div>
                  <p className="text-ink-faint text-[12px] leading-relaxed">
                    Connect your account to backup your transaction history and budgets to Google Drive.
                  </p>
                  <button 
                    className="w-full inline-flex items-center justify-center gap-1.5 px-[14px] py-[8px] rounded-sm text-xs font-semibold transition duration-150 ease-in-out border border-transparent bg-accent text-white hover:brightness-108 cursor-pointer mt-1" 
                    onClick={() => {
                      handleConnectGoogle();
                      setIsProfileOpen(false);
                    }}
                  >
                    Connect Google Account
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="flex gap-1 my-5 border-b border-line overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          className={`bg-transparent border-b-2 px-4 pb-3 pt-2.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition duration-150 ease-in-out ${
            currentTab === 'dashboard' ? 'text-ink border-b-accent' : 'text-ink-faint border-b-transparent hover:text-ink'
          }`}
          onClick={() => setCurrentTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`bg-transparent border-b-2 px-4 pb-3 pt-2.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition duration-150 ease-in-out ${
            currentTab === 'history' ? 'text-ink border-b-accent' : 'text-ink-faint border-b-transparent hover:text-ink'
          }`}
          onClick={() => setCurrentTab('history')}
        >
          History
        </button>
        <button
          className={`bg-transparent border-b-2 px-4 pb-3 pt-2.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition duration-150 ease-in-out ${
            currentTab === 'reports' ? 'text-ink border-b-accent' : 'text-ink-faint border-b-transparent hover:text-ink'
          }`}
          onClick={() => setCurrentTab('reports')}
        >
          Reports
        </button>
        <button
          className={`bg-transparent border-b-2 px-4 pb-3 pt-2.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition duration-150 ease-in-out ${
            currentTab === 'caps' ? 'text-ink border-b-accent' : 'text-ink-faint border-b-transparent hover:text-ink'
          }`}
          onClick={() => setCurrentTab('caps')}
        >
          Caps
        </button>
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
