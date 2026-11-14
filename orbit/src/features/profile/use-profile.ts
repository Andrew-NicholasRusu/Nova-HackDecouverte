/**
 * The signed-in student's profile (public.profiles): one shared store, validation and writes.
 * Profile pictures are uploaded by `avatar.ts` in this folder.
 */

import { useEffect } from 'react';

import { PROFILE_LIMITS, USERNAME_RE } from '@/data/constants';
import type { Profile, ProfileEdit, ProfileErrors } from '@/data/types';
import { useAuth } from '@/features/auth/auth-provider';
import { createStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

const PROFILE_COLUMNS = 'id, username, display_name, bio, avatar_url, preferred_campus';

/** Mirrors the DB checks on public.profiles. Returns field errors (empty = valid). */
export function validateProfile(p: ProfileEdit): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!p.username || !USERNAME_RE.test(p.username)) {
    errors.username = '3–24 characters: lowercase letters, numbers or _.';
  }
  if (!p.display_name.trim()) errors.display_name = 'Enter a name friends will recognise.';
  else if (p.display_name.length > PROFILE_LIMITS.displayName) errors.display_name = `Keep it under ${PROFILE_LIMITS.displayName} characters.`;
  if (p.bio && p.bio.length > PROFILE_LIMITS.bio) errors.bio = `Keep it under ${PROFILE_LIMITS.bio} characters.`;
  return errors;
}

/** A username guess from a display name: "Zoë Martin" → "zoe_martin". */
export function suggestUsername(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
}

/** The editable fields of a profile (empty when there is none yet). */
export function toProfileEdit(profile: Profile | null): ProfileEdit {
  return {
    display_name: profile?.display_name ?? '',
    username: profile?.username ?? null,
    bio: profile?.bio ?? null,
    preferred_campus: profile?.preferred_campus ?? null,
  };
}

/** True when the edit differs from the saved profile. */
export function isProfileEdited(edit: ProfileEdit, profile: Profile | null) {
  const saved = toProfileEdit(profile);
  return (
    edit.display_name !== saved.display_name ||
    edit.username !== saved.username ||
    (edit.bio ?? '') !== (saved.bio ?? '') ||
    edit.preferred_campus !== saved.preferred_campus
  );
}

type State =
  | { status: 'idle' | 'loading'; profile: Profile | null; userId?: string }
  | { status: 'ready'; profile: Profile | null; userId?: string }
  | { status: 'error'; profile: Profile | null; userId?: string; error: string };

const store = createStore<State>({ status: 'idle', profile: null });

async function load(userId: string) {
  store.set({ status: 'loading', profile: store.get().userId === userId ? store.get().profile : null, userId });
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (store.get().userId !== userId) return; // signed out meanwhile
  if (error) store.set({ status: 'error', profile: null, userId, error: error.message });
  else store.set({ status: 'ready', profile: data as Profile | null, userId });
}

/** The signed-in student's profile, shared across screens. */
export function useProfileState(): State {
  const { session } = useAuth();
  const userId = session?.user.id;
  const snapshot = store.useSnapshot();
  useEffect(() => {
    if (!userId) {
      if (store.get().userId) store.set({ status: 'idle', profile: null });
    } else if (store.get().userId !== userId || store.get().status === 'idle') {
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
  const userId = store.get().userId;
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
  store.set({ status: 'ready', profile, userId });
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

/** Sets (or clears) the profile picture URL. The image itself is uploaded by `avatar.ts`. */
export async function setAvatarUrl(url: string | null) {
  await saveProfile({ avatar_url: url });
}

/** Try loading the profile again (after an error). */
export function reloadProfile() {
  const { userId } = store.get();
  if (userId) void load(userId);
}
