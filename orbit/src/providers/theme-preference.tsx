import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemePreference = 'system' | 'light' | 'dark';

const KEY = 'orbit.themePreference';

type Ctx = {
  preference: ThemePreference;
  scheme: 'light' | 'dark';
  setPreference: (p: ThemePreference) => void;
};

const ThemePreferenceContext = createContext<Ctx>({
  preference: 'system',
  scheme: 'light',
  setPreference: () => {},
});

/** Device-level appearance setting. Stored locally: it is a per-device preference, not profile data. */
export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPref(v);
      })
      .catch(() => {});
  }, []);

  const setPreference = (p: ThemePreference) => {
    setPref(p);
    AsyncStorage.setItem(KEY, p).catch(() => {});
  };

  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  return (
    <ThemePreferenceContext.Provider value={{ preference, scheme, setPreference }}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export const useThemePreference = () => useContext(ThemePreferenceContext);
