import React from 'react';
import type { UserProfile } from '../store/authSlice';
import { Button } from './ui/Button';

interface ProfileDropdownProps {
  authStatus: 'unauthenticated' | 'authenticating' | 'authenticated' | 'failed';
  user: UserProfile | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'failed';
  lastSynced: string | null;
  syncError: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onForceBackup: () => void;
  onClose: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  authStatus,
  user,
  syncStatus,
  lastSynced,
  syncError,
  onConnect,
  onDisconnect,
  onForceBackup,
  onClose,
}) => {
  return (
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
            <Button 
              onClick={() => {
                onForceBackup();
                onClose();
              }}
              disabled={syncStatus === 'syncing'}
            >
              Force Backup
            </Button>
            <Button 
              variant="ghost"
              onClick={() => {
                onDisconnect();
                onClose();
              }}
              className="text-bad hover:text-bad"
            >
              Disconnect Account
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 text-center">
          <div className="text-sm font-semibold text-ink">Google Sync</div>
          <p className="text-ink-faint text-[12px] leading-relaxed">
            Connect your account to backup your transaction history and budgets to Google Drive.
          </p>
          <Button 
            onClick={() => {
              onConnect();
              onClose();
            }}
            className="mt-1"
          >
            Connect Google Account
          </Button>
        </div>
      )}
    </div>
  );
};
