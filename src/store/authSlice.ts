import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchUserProfile } from '../services/gdrive';

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

interface AuthState {
  clientId: string;
  accessToken: string | null;
  user: UserProfile | null;
  status: 'unauthenticated' | 'authenticating' | 'authenticated' | 'failed';
  error: string | null;
}

const LS_CLIENT_ID = "ledger_client_id_v1";
const SS_AUTH_TOKEN = "ledger_auth_token_v1";
const SS_AUTH_USER = "ledger_auth_user_v1";
const SS_TOKEN_EXPIRY = "ledger_token_expiry_v1";
const SS_SESSION_EXPIRY = "ledger_session_expiry_v1";

// Read from build environment variable
const DEFAULT_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const getStoredToken = (): string | null => {
  const token = sessionStorage.getItem(SS_AUTH_TOKEN);
  const tokenExpiry = sessionStorage.getItem(SS_TOKEN_EXPIRY);
  const sessionExpiry = sessionStorage.getItem(SS_SESSION_EXPIRY);
  
  if (token && tokenExpiry && sessionExpiry) {
    const tExp = parseInt(tokenExpiry, 10);
    const sExp = parseInt(sessionExpiry, 10);
    
    // Return token only if both token and session are still valid
    if (Date.now() < tExp && Date.now() < sExp) {
      return token;
    }
  }
  return null;
};

const getStoredUser = (): UserProfile | null => {
  try {
    const userStr = sessionStorage.getItem(SS_AUTH_USER);
    const sessionExpiry = sessionStorage.getItem(SS_SESSION_EXPIRY);
    if (userStr && sessionExpiry) {
      const sExp = parseInt(sessionExpiry, 10);
      if (Date.now() < sExp) {
        return JSON.parse(userStr);
      }
    }
  } catch {}
  return null;
};

const isSessionActive = (): boolean => {
  const sessionExpiry = sessionStorage.getItem(SS_SESSION_EXPIRY);
  if (sessionExpiry) {
    return Date.now() < parseInt(sessionExpiry, 10);
  }
  return false;
};

const initialState: AuthState = {
  clientId: localStorage.getItem(LS_CLIENT_ID) || DEFAULT_CLIENT_ID,
  accessToken: getStoredToken(),
  user: getStoredUser(),
  // Active session in sessionStorage restores authenticated state so silent refresh triggers
  status: isSessionActive() ? 'authenticated' : 'unauthenticated',
  error: null,
};

// Async Thunk for OAuth authentication and user profile loading
export const loginWithAccessToken = createAsyncThunk(
  'auth/loginWithAccessToken',
  async (accessToken: string, { rejectWithValue }) => {
    try {
      const user = await fetchUserProfile(accessToken);
      
      const tokenExpiry = Date.now() + 3550 * 1000; // 1 hour token validity (with buffer)
      const sessionExpiry = Date.now() + 72 * 3600 * 1000; // 72 hours max session duration in sessionStorage
      
      sessionStorage.setItem(SS_AUTH_TOKEN, accessToken);
      sessionStorage.setItem(SS_TOKEN_EXPIRY, tokenExpiry.toString());
      sessionStorage.setItem(SS_SESSION_EXPIRY, sessionExpiry.toString());
      sessionStorage.setItem(SS_AUTH_USER, JSON.stringify(user));

      return { accessToken, user };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to retrieve Google profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setClientId: (state, action: PayloadAction<string>) => {
      state.clientId = action.payload;
      localStorage.setItem(LS_CLIENT_ID, action.payload);
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.status = 'unauthenticated';
      state.error = null;

      sessionStorage.removeItem(SS_AUTH_TOKEN);
      sessionStorage.removeItem(SS_AUTH_USER);
      sessionStorage.removeItem(SS_TOKEN_EXPIRY);
      sessionStorage.removeItem(SS_SESSION_EXPIRY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithAccessToken.pending, (state) => {
        state.status = 'authenticating';
        state.error = null;
      })
      .addCase(loginWithAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.status = 'authenticated';
        state.error = null;
      })
      .addCase(loginWithAccessToken.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Google profile authentication failed';
        state.accessToken = null;
        state.user = null;

        sessionStorage.removeItem(SS_AUTH_TOKEN);
        sessionStorage.removeItem(SS_AUTH_USER);
        sessionStorage.removeItem(SS_TOKEN_EXPIRY);
        sessionStorage.removeItem(SS_SESSION_EXPIRY);
      });
  },
});

export const { setClientId, logout } = authSlice.actions;
export default authSlice.reducer;
