import { useAppDispatch, useAppSelector } from '../store';
import { logout, loginWithAccessToken, setClientId } from '../store/authSlice';
import { uploadBackupToDrive } from '../store/ledgerSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const ledger = useAppSelector((state) => state.ledger);

  const handleConnectGoogle = (showToast: (msg: string) => void) => {
    if (!auth.clientId) {
      showToast('OAuth Client ID is missing. Set VITE_GOOGLE_CLIENT_ID in your .env file.');
      return;
    }
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: auth.clientId,
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
    } catch (err) {
      showToast('Client auth failed. Verify your Client ID.');
    }
  };

  const handleDisconnect = (showToast: (msg: string) => void) => {
    dispatch(logout());
    showToast('Google Account disconnected');
  };

  const handleForceBackup = (showToast: (msg: string) => void) => {
    if (!auth.accessToken) return;
    dispatch(uploadBackupToDrive({ accessToken: auth.accessToken, force: true }))
      .unwrap()
      .then(() => {
        showToast('Backup completed successfully');
      })
      .catch((err) => {
        showToast(err || 'Manual backup failed');
      });
  };

  return {
    credentials: {
      status: auth.status,
      user: auth.user,
      clientId: auth.clientId,
      accessToken: auth.accessToken,
      error: auth.error,
    },
    sync: {
      status: ledger.syncStatus,
      lastSynced: ledger.lastSynced,
      error: ledger.error,
      gdriveFileId: ledger.gdriveFileId,
    },
    actions: {
      connect: handleConnectGoogle,
      disconnect: handleDisconnect,
      forceBackup: handleForceBackup,
      updateClientId: (id: string) => dispatch(setClientId(id)),
    }
  };
};
