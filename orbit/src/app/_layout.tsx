import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Colors, Spacing } from '@/constants/theme';
import { applyWebTheme } from '@/lib/web-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthScreen } from '@/features/auth/auth-screen';
import { OnboardingScreen } from '@/features/profile/onboarding-screen';
import { useProfileState } from '@/features/profile/use-profile';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

function AuthGate() {
  const { session, loading } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (loading || !(fontsLoaded || fontError)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return session ? <ProfileGate /> : <AuthScreen />;
}

/** New students pick a username and campus before entering the app. */
function ProfileGate() {
  const { status, profile } = useProfileState();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  if ((status === 'loading' || status === 'idle') && !profile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  // If the profile can't be loaded (e.g. migration not run yet) don't lock the student out.
  if (profile && !profile.username) return <OnboardingScreen profile={profile} />;
  return <AppTabs />;
}

/** Last line of defence: a calm screen instead of a blank page if something throws. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={[styles.center, styles.boundary]}>
      <ThemedText type="displaySmall" accessibilityRole="header">
        Something went wrong
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
        {error.message}
      </ThemedText>
      <Button label="Try again" icon="refresh" onPress={retry} />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  useEffect(() => applyWebTheme(dark ? 'dark' : 'light'), [dark]);
  const colors = Colors[dark ? 'dark' : 'light'];
  const base = dark ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: colors.accent,
          background: colors.background,
          card: colors.backgroundElement,
          text: colors.text,
          border: colors.border,
        },
      }}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  boundary: { gap: Spacing.three, padding: Spacing.four },
  centerText: { textAlign: 'center' },
});
