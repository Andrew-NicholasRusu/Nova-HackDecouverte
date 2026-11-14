import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export type Profile = {
  id: string;
  username: string | null;
  display_name: string;
  preferred_campus: 'SGW' | 'LOY' | null;
};

/** The signed-in student's own profile row (null until loaded or if the table is missing). */
export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from('profiles')
      .select('id, username, display_name, preferred_campus')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfile(data as Profile | null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return userId ? profile : null;
}
