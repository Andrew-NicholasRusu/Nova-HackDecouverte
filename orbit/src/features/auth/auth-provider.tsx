import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  loading: boolean;
  /** Latest auth event; the root layout sends the student to /logged-out on 'SIGNED_OUT'. */
  event: AuthChangeEvent | null;
};

const AuthContext = createContext<AuthState>({ session: null, loading: true, event: null });

/** Keeps the Supabase session in React state for the route guards and screens. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true, event: null });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState((prev) => ({ ...prev, session: data.session, loading: false }));
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ session, loading: false, event });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
