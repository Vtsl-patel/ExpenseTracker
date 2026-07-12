import type { Expense, Caps } from '../types';
import type { UserProfile } from '../store/authSlice';

/**
 * Service wrapper for interacting with the Google Drive API v3
 */

// Fetches basic profile information for the authenticated user
export const fetchUserProfile = async (accessToken: string): Promise<UserProfile> => {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('Failed to retrieve user profile information');
  }

  const data = await res.json();
  return {
    name: data.name || 'Google User',
    email: data.email || '',
    picture: data.picture || '',
  };
};

// Searches the user's Google Drive for a file named "ledger_data.json"
// Returns the file ID if found, otherwise null
export const findDataFile = async (accessToken: string): Promise<string | null> => {
  const query = encodeURIComponent("name = 'ledger_data.json' and trashed = false");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('Failed to query files in Google Drive');
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
};

// Creates a new empty "ledger_data.json" file in the user's Google Drive
// Returns the new file ID
export const createDataFile = async (accessToken: string): Promise<string> => {
  const metadata = {
    name: 'ledger_data.json',
    mimeType: 'application/json',
  };

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    throw new Error('Failed to create ledger_data.json file in Google Drive');
  }

  const data = await res.json();
  return data.id;
};

// Downloads data from a specific file ID in Google Drive
export const downloadData = async (
  accessToken: string,
  fileId: string
): Promise<{ entries: Expense[]; caps: Caps }> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('Failed to download ledger data from Google Drive');
  }

  return await res.json();
};

// Uploads (overwrites) data for a specific file ID in Google Drive
export const uploadData = async (
  accessToken: string,
  fileId: string,
  data: { entries: Expense[]; caps: Caps }
): Promise<void> => {
  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to upload data updates to Google Drive');
  }
};
