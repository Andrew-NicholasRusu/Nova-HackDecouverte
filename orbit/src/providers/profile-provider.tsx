import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Profile, ProfileInput } from '@/features/profile/profile-schema';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string; missingTable: boolean }
  | { status: 'ready'; profile: Profile };

type Ctx = {
  state: State;
  reload: () => void;
  /** Saves fields to the signed-in user's profile. Returns an error message or null. */
  save: (input: Partial<ProfileInput>) => Promise<string | null>;
};

const ProfileContext = createContext<Ctx | null>(null);
const COLUMNS = 'id, username, display_name, bio, preferred_campus';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from('profiles')
      .select(COLUMNS)
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ status: 'error', message: error.message, missingTable: error.code === 'PGRST205' });
        } else if (!data) {
          setState({
            status: 'error',
            message: 'Your profile was not created. Sign out and sign in again, or contact the team.',
            missingTable: false,
          });
        } else {
          setState({ status: 'ready', profile: data as Profile });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  const save = useCallback(
    async (input: Partial<ProfileInput>) => {
      if (!userId) return 'You are signed out.';
      const { data, error } = await supabase
        .from('profiles')
        .update(input)
        .eq('id', userId)
        .select(COLUMNS)
        .single();
      if (error) {
        if (error.code === '23505') return 'That username is already taken.';
        return error.message;
      }
      setState({ status: 'ready', profile: data as Profile });
      return null;
    },
    [userId],
  );

  return <ProfileContext.Provider value={{ state, reload, save }}>{children}</ProfileContext.Provider>;
}

export function useProfileState() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfileState must be used inside ProfileProvider');
  return ctx;
}

/** The signed-in student's profile, or null while loading / on error. */
export function useProfile() {
  const { state } = useProfileState();
  return state.status === 'ready' ? state.profile : null;
}
