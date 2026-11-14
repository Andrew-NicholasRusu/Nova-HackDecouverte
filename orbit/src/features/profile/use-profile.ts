import { useEffect, useSyncExternalStore } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export type Campus = 'SGW' | 'LOY';

export type Profile = {
  id: string;
  username: string | null;
  display_name: string;
  bio: string | null;
  preferred_campus: Campus | null;
};

export type ProfileEdit = Pick<Profile, 'username' | 'display_name' | 'bio' | 'preferred_campus'>;

export const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

/** Mirrors the DB checks on public.profiles. Returns field errors (empty = valid). */
export function validateProfile(p: ProfileEdit): Partial<Record<keyof ProfileEdit, string>> {
  const errors: Partial<Record<keyof ProfileEdit, string>> = {};
  if (!p.username || !USERNAME_RE.test(p.username)) {
    errors.username = '3–24 characters: lowercase letters, numbers or _.';
  }
  if (!p.display_name.trim()) errors.display_name = 'Enter a name friends will recognise.';
  else if (p.display_name.length > 60) errors.display_name = 'Keep it under 60 characters.';
  if (p.bio && p.bio.length > 280) errors.bio = 'Keep it under 280 characters.';
  return errors;
}

type State =
  | { status: 'idle' | 'loading'; profile: Profile | null; userId?: string }
  | { status: 'ready'; profile: Profile | null; userId?: string }
  | { status: 'error'; profile: Profile | null; userId?: string; error: string };

let state: State = { status: 'idle', profile: null };
const listeners = new Set<() => void>();
const setState = (next: State) => {
  state = next;
  listeners.forEach((l) => l());
};

async function load(userId: string) {
  setState({ status: 'loading', profile: state.userId === userId ? state.profile : null, userId });
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, preferred_campus')
    .eq('id', userId)
    .maybeSingle();
  if (state.userId !== userId) return; // signed out meanwhile
  if (error) setState({ status: 'error', profile: null, userId, error: error.message });
  else setState({ status: 'ready', profile: data as Profile | null, userId });
}

/** The signed-in student's profile, shared across screens. */
export function useProfileState(): State {
  const { session } = useAuth();
  const userId = session?.user.id;
  const snapshot = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
  useEffect(() => {
    if (!userId) {
      if (state.userId) setState({ status: 'idle', profile: null });
    } else if (state.userId !== userId || state.status === 'idle') {
      void load(userId);
    }
  }, [userId]);
  return userId && snapshot.userId === userId ? snapshot : { status: 'loading', profile: null };
}

/** The profile row, or null while loading / if missing. */
export function useProfile() {
  return useProfileState().profile;
}

export async function updateProfile(edit: ProfileEdit) {
  const userId = state.userId;
  if (!userId) throw new Error('Not signed in.');
  const { data, error } = await supabase
    .from('profiles')
    .update({
      username: edit.username,
      display_name: edit.display_name.trim(),
      bio: edit.bio?.trim() || null,
      preferred_campus: edit.preferred_campus,
    })
    .eq('id', userId)
    .select('id, username, display_name, bio, preferred_campus')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('That username is taken. Try another one.');
    throw new Error(error.message);
  }
  setState({ status: 'ready', profile: data as Profile, userId });
}
