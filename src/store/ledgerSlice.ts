import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Expense, Caps } from '../types';
import { CATEGORIES, LS_ENTRIES, LS_CAPS } from '../constants';
import { findDataFile, createDataFile, downloadData, uploadData } from '../services/gdrive';
import { logout } from './authSlice';

interface LedgerState {
  entries: Expense[];
  caps: Caps;
  deletedIds: string[];
  gdriveFileId: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'failed';
  lastSynced: string | null;
  error: string | null;
}

const LS_DELETED_IDS = "ledger_deleted_ids_v1";

const getInitialEntries = (): Expense[] => {
  try {
    const stored = localStorage.getItem(LS_ENTRIES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const getInitialCaps = (): Caps => {
  let raw: Caps = {};
  try {
    const stored = localStorage.getItem(LS_CAPS);
    if (stored) raw = JSON.parse(stored);
  } catch {
    raw = {};
  }
  // Fill defaults
  CATEGORIES.forEach((c) => {
    if (!raw[c.id]) {
      raw[c.id] = { weekly: 0, monthly: 0 };
    }
  });
  return raw;
};

const getInitialDeletedIds = (): string[] => {
  try {
    const stored = localStorage.getItem(LS_DELETED_IDS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const initialState: LedgerState = {
  entries: getInitialEntries(),
  caps: getInitialCaps(),
  deletedIds: getInitialDeletedIds(),
  gdriveFileId: null,
  syncStatus: 'idle',
  lastSynced: null,
  error: null,
};

// Async Thunk: Handles searching/creating/downloading and non-destructive merging with Google Drive
export const syncGoogleDriveData = createAsyncThunk(
  'ledger/syncGoogleDriveData',
  async (accessToken: string, { getState, rejectWithValue, dispatch }) => {
    try {
      let fileId = await findDataFile(accessToken);
      const state = getState() as { ledger: LedgerState };
      const { entries, caps, deletedIds } = state.ledger;

      if (!fileId) {
        // 1. Create file if not found
        fileId = await createDataFile(accessToken);
        // 2. Upload current local entries, caps, and tombstones
        await uploadData(accessToken, fileId, { entries, caps, deletedIds });
        return { fileId, entries, caps, deletedIds };
      } else {
        // 1. File exists, download it
        const remoteData = await downloadData(accessToken, fileId);
        const remoteDeletedIds = remoteData.deletedIds || [];

        // 2. Merge deleted IDs (union tombstone list)
        const mergedDeletedIds = Array.from(new Set([...deletedIds, ...remoteDeletedIds]));

        // 3. Perform a non-destructive merge of entries (union of entries by unique ID),
        // filtering out any entries that are marked as deleted!
        const localIds = new Set(entries.map((e) => e.id));
        const mergedEntries = entries.filter((e) => !mergedDeletedIds.includes(e.id));

        remoteData.entries.forEach((remoteExp) => {
          if (!mergedDeletedIds.includes(remoteExp.id) && !localIds.has(remoteExp.id)) {
            mergedEntries.push(remoteExp);
          }
        });

        // Merge caps: retain local overrides, fall back to remote values
        const mergedCaps = { ...caps };
        Object.keys(remoteData.caps).forEach((catId) => {
          const localCap = caps[catId];
          const remoteCap = remoteData.caps[catId];
          if (
            remoteCap &&
            (!localCap || (localCap.weekly === 0 && localCap.monthly === 0))
          ) {
            mergedCaps[catId] = remoteCap;
          }
        });

        // Upload the merged state back to Google Drive
        await uploadData(accessToken, fileId, { 
          entries: mergedEntries, 
          caps: mergedCaps, 
          deletedIds: mergedDeletedIds 
        });

        return { fileId, entries: mergedEntries, caps: mergedCaps, deletedIds: mergedDeletedIds };
      }
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        dispatch(logout());
      }
      return rejectWithValue(err.message || 'Failed to sync with Google Drive');
    }
  }
);

// Async Thunk: Background debounced auto-sync and manual force-sync actions
export const uploadBackupToDrive = createAsyncThunk(
  'ledger/uploadBackupToDrive',
  async (options: { accessToken: string; force?: boolean }, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as { ledger: LedgerState };
      const { entries, caps, deletedIds, gdriveFileId, syncStatus } = state.ledger;

      if (!gdriveFileId) {
        throw new Error('No Google Drive file connected');
      }

      // If not forced and not in 'idle' state (i.e. no unsaved changes), skip backup
      if (!options.force && syncStatus !== 'idle') {
        return rejectWithValue('Sync skipped: no pending changes');
      }

      await uploadData(options.accessToken, gdriveFileId, { entries, caps, deletedIds });
      return { entries, caps };
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        dispatch(logout());
      }
      return rejectWithValue(err.message || 'Auto-sync backup failed');
    }
  }
);

const ledgerSlice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    addExpense: (state, action: PayloadAction<Omit<Expense, 'id'>>) => {
      const newEntry: Expense = {
        ...action.payload,
        id: Date.now() + Math.random().toString(16).slice(2),
      };
      state.entries.push(newEntry);
      localStorage.setItem(LS_ENTRIES, JSON.stringify(state.entries));
      state.syncStatus = 'idle'; // Reset sync state to idle so auto-sync fires
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter((e) => e.id !== action.payload);
      localStorage.setItem(LS_ENTRIES, JSON.stringify(state.entries));
      if (!state.deletedIds.includes(action.payload)) {
        state.deletedIds.push(action.payload);
        localStorage.setItem(LS_DELETED_IDS, JSON.stringify(state.deletedIds));
      }
      state.syncStatus = 'idle'; // Reset sync state to idle
    },
    updateCap: (state, action: PayloadAction<{ categoryId: string; period: 'weekly' | 'monthly'; value: number }>) => {
      const { categoryId, period, value } = action.payload;
      if (state.caps[categoryId]) {
        state.caps[categoryId][period] = value;
        localStorage.setItem(LS_CAPS, JSON.stringify(state.caps));
        state.syncStatus = 'idle'; // Reset sync state to idle
      }
    },
    setLedgerData: (state, action: PayloadAction<{ entries: Expense[]; caps: Caps }>) => {
      state.entries = action.payload.entries;
      state.caps = action.payload.caps;
      localStorage.setItem(LS_ENTRIES, JSON.stringify(state.entries));
      localStorage.setItem(LS_CAPS, JSON.stringify(state.caps));
    },
    setGdriveFileId: (state, action: PayloadAction<string | null>) => {
      state.gdriveFileId = action.payload;
    },
    setSyncStatus: (state, action: PayloadAction<'idle' | 'syncing' | 'synced' | 'failed'>) => {
      state.syncStatus = action.payload;
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.syncStatus = 'failed';
    },
  },
  extraReducers: (builder) => {
    builder
      // Sync Google Drive Data Thunk lifecycle cases
      .addCase(syncGoogleDriveData.pending, (state) => {
        state.syncStatus = 'syncing';
        state.error = null;
      })
      .addCase(syncGoogleDriveData.fulfilled, (state, action) => {
        state.gdriveFileId = action.payload.fileId;
        state.entries = action.payload.entries;
        state.caps = action.payload.caps;
        state.deletedIds = action.payload.deletedIds;
        state.syncStatus = 'synced';
        state.lastSynced = new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        localStorage.setItem(LS_ENTRIES, JSON.stringify(state.entries));
        localStorage.setItem(LS_CAPS, JSON.stringify(state.caps));
        localStorage.setItem(LS_DELETED_IDS, JSON.stringify(state.deletedIds));
      })
      .addCase(syncGoogleDriveData.rejected, (state, action) => {
        state.syncStatus = 'failed';
        state.error = (action.payload as string) || 'Drive sync failed';
      })
      
      // Upload Backup Thunk lifecycle cases
      .addCase(uploadBackupToDrive.pending, (state) => {
        state.syncStatus = 'syncing';
        state.error = null;
      })
      .addCase(uploadBackupToDrive.fulfilled, (state) => {
        state.syncStatus = 'synced';
        state.lastSynced = new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      })
      .addCase(uploadBackupToDrive.rejected, (state, action) => {
        if (action.payload === 'Sync skipped: no pending changes') {
          return;
        }
        state.syncStatus = 'failed';
        state.error = (action.payload as string) || 'Backup failed';
      });
  },
});

export const {
  addExpense,
  deleteExpense,
  updateCap,
  setLedgerData,
  setGdriveFileId,
  setSyncStatus,
  setSyncError,
} = ledgerSlice.actions;

export default ledgerSlice.reducer;
