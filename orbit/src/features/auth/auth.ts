/** Account actions. Each returns a readable error message, or null on success. */

import { PASSWORD_MIN_LENGTH } from '@/data/constants';
import { supabase } from '@/lib/supabase';

export type SignUpResult = { error: string | null; needsConfirmation: boolean };

const cleanEmail = (email: string) => email.trim().toLowerCase();

export async function signIn(email: string, password: string): Promise<string | null> {
  if (!cleanEmail(email) || !password) return 'Enter your email and password.';
  const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail(email), password });
  return error?.message ?? null;
}

export async function signUp(email: string, password: string, displayName: string): Promise<SignUpResult> {
  const fail = (error: string) => ({ error, needsConfirmation: false });
  if (!cleanEmail(email) || !password) return fail('Enter your email and password.');
  if (password.length < PASSWORD_MIN_LENGTH) return fail(`Use at least ${PASSWORD_MIN_LENGTH} characters for your password.`);
  if (!displayName.trim()) return fail('Enter a display name.');

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail(email),
    password,
    options: { data: { display_name: displayName.trim() } },
  });
  if (error) return fail(error.message);
  return { error: null, needsConfirmation: !data.session };
}

/** Ends the session; the route guards then show /logged-out. */
export async function signOut() {
  await supabase.auth.signOut();
}
