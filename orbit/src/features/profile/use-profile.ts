import { useEffect, useSyncExternalStore } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export type Campus = 'SGW' | 'LOY';

export type Profile = {
  id: string;
  username: string | null;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  preferred_campus: Campus | null;
};

export type ProfileEdit = Pick<Profile, 'username' | 'display_name' | 'bio' | 'preferred_campus'>;

const PROFILE_COLUMNS = 'id, username, display_name, bio, avatar_url, preferred_campus';

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
    .select(PROFILE_COLUMNS)
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

/** Writes a partial profile; creates the row first if the account never got one. */
async function saveProfile(patch: Partial<Omit<Profile, 'id'>>): Promise<Profile> {
  const userId = state.userId;
  if (!userId) throw new Error('Not signed in.');
  let res = await supabase.from('profiles').update(patch).eq('id', userId).select(PROFILE_COLUMNS);
  if (!res.error && res.data.length === 0) {
    res = await supabase.from('profiles').insert({ id: userId, ...patch }).select(PROFILE_COLUMNS);
  }
  if (res.error) {
    if (res.error.code === '23505') throw new Error('That username is taken. Try another one.');
    if (res.error.code === '42501') {
      throw new Error('Your profile row is missing. Run supabase/migrations/20261114050000_profile_repair.sql in the Supabase SQL editor.');
    }
    throw new Error(res.error.message);
  }
  const profile = res.data[0] as Profile;
  setState({ status: 'ready', profile, userId });
  return profile;
}

export async function updateProfile(edit: ProfileEdit) {
  await saveProfile({
    username: edit.username,
    display_name: edit.display_name.trim(),
    bio: edit.bio?.trim() || null,
    preferred_campus: edit.preferred_campus,
  });
}

/** Sets (or clears) the profile picture URL. The image itself is uploaded by `lib/avatar.ts`. */
export async function setAvatarUrl(url: string | null) {
  await saveProfile({ avatar_url: url });
}

/** Try loading the profile again (after an error). */
export function reloadProfile() {
  if (state.userId) void load(state.userId);
}
