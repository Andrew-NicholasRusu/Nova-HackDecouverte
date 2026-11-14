import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!url || !key) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY. Copy .env.example to .env.local.',
  );
}

// During web server rendering there is no window/localStorage; don't persist there.
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = createClient(url, key, {
  auth: {
    storage: isServer ? undefined : AsyncStorage,
    persistSession: !isServer,
    autoRefreshToken: !isServer,
    detectSessionInUrl: false,
  },
});

// Native: only refresh tokens while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** PostgREST / Postgres codes for a table or function that does not exist yet. */
const MISSING_CODES = new Set(['PGRST202', 'PGRST205', '42P01']);

/** A readable message for a Supabase error; a missing table points to the migration that creates it. */
export function toUserError(error: { code?: string; message: string }, missingHint: string): string {
  return error.code && MISSING_CODES.has(error.code) ? missingHint : error.message;
}

/**
 * Calls `onChange` whenever a different account signs in or the student signs out,
 * so per-user stores can drop the previous account's data.
 */
export function onUserChange(onChange: () => void) {
  let currentUserId: string | undefined;
  supabase.auth.onAuthStateChange((_event, session) => {
    const userId = session?.user.id;
    if (userId !== currentUserId) {
      currentUserId = userId;
      onChange();
    }
  });
}
