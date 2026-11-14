import { useEffect } from 'react';
import { Stack, ThemeProvider } from 'expo-router';

import { LoadingScreen } from '@/components/layout/loading-screen';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { applyWebTheme } from '@/lib/web-theme';
import { useAppFonts } from '@/styles/fonts';
import { navigationTheme } from '@/styles/navigation-theme';

export { ErrorScreen as ErrorBoundary } from '@/components/layout/error-screen';

/** Waits for the session and fonts; the (app) and (auth) layouts redirect between each other. */
function RootNavigator() {
  const { loading } = useAuth();
  const fontsReady = useAppFonts();

  if (loading || !fontsReady) return <LoadingScreen />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  useEffect(() => applyWebTheme(scheme), [scheme]);

  return (
    <ThemeProvider value={navigationTheme(scheme)}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
