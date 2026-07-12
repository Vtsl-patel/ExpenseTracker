import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { logout, loginWithAccessToken, setClientId } from '../store/authSlice';
import { syncGoogleDriveData } from '../store/ledgerSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const ledger = useAppSelector((state) => state.ledger);

  const { clientId, accessToken, status, user, error } = auth;

  // 1. Initialize Google Identity Client & auto-login on reload
  useEffect(() => {
    if (clientId) {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: (tokenResponse) => {
            if (tokenResponse.error) {
              return;
            }
            const token = tokenResponse.access_token;
            dispatch(loginWithAccessToken(token));
          },
        });
        window.googleTokenClient = client;

        // Auto-login / Silent Refresh on page reload:
        const sessionExpiry = sessionStorage.getItem('ledger_session_expiry_v1');
        const token = sessionStorage.getItem('ledger_auth_token_v1');
        const tokenExpiry = sessionStorage.getItem('ledger_token_expiry_v1');

        if (sessionExpiry && parseInt(sessionExpiry, 10) > Date.now()) {
          if (!token || !tokenExpiry || parseInt(tokenExpiry, 10) <= Date.now()) {
            client.requestAccessToken({ prompt: '' });
          }
        }
      } catch (err) {
        console.error('Failed to initialize Google login client', err);
      }
    }
  }, [clientId, dispatch]);

  // 2. Silent token refresh loop (Runs every 50 minutes while accessToken is present)
  useEffect(() => {
    if (accessToken) {
      const timer = setTimeout(() => {
        const client = window.googleTokenClient;
        if (client) {
          client.requestAccessToken({ prompt: '' });
        }
      }, 50 * 60 * 1000); // 50 minutes

      return () => clearTimeout(timer);
    }
  }, [accessToken]);

  // 3. Tab Focus listener to pull remote changes silently
  useEffect(() => {
    const handleFocus = () => {
      if (accessToken) {
        dispatch(syncGoogleDriveData(accessToken));
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [accessToken, dispatch]);

  const handleConnectGoogle = (showToast: (msg: string) => void) => {
    const client = window.googleTokenClient;
    if (client) {
      try {
        client.requestAccessToken();
      } catch (err) {
        showToast('Google login popup failed to open');
      }
    } else {
      showToast('Google Client ID is missing or not initialized.');
    }
  };

  const handleDisconnect = (showToast: (msg: string) => void) => {
    dispatch(logout());
    showToast('Google Account disconnected');
  };

  return {
    credentials: {
      status,
      user,
      clientId,
      accessToken,
      error,
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
      updateClientId: (id: string) => dispatch(setClientId(id)),
    }
  };
};
