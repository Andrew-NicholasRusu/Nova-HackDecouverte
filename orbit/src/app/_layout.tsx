import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { AuthScreen } from '@/features/auth/auth-screen';
import { OnboardingScreen } from '@/features/onboarding/onboarding-screen';
import { ProfileSetupError } from '@/features/profile/profile-setup-error';
import { useTheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { ProfileProvider, useProfileState } from '@/providers/profile-provider';
import { ThemePreferenceProvider, useThemePreference } from '@/providers/theme-preference';

const isWeb = Platform.OS === 'web';

function Loading() {
  const theme = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <ActivityIndicator color={theme.accent} accessibilityLabel="Loading" />
    </View>
  );
}

/** Signed in → profile loaded → onboarding complete → app. */
function AppGate() {
  const { state, reload } = useProfileState();
  const theme = useTheme();

  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') {
    return (
      <ProfileSetupError
        message={state.message}
        missingTable={state.missingTable}
        onRetry={reload}
      />
    );
  }
  if (!state.profile.username || !state.profile.preferred_campus) {
    return <OnboardingScreen profile={state.profile} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTintColor: theme.accent,
        headerStyle: { backgroundColor: theme.backgroundElement },
        headerTitleStyle: { color: theme.text },
      }}>
      <Stack.Screen name="(tabs)" />
      {/* Native gets a back header; web screens render their own Back link. */}
      <Stack.Screen name="settings" options={{ title: 'Settings', headerShown: !isWeb }} />
      <Stack.Screen name="floorplan" options={{ title: 'Floor plans', headerShown: true }} />
    </Stack>
  );
}

function AuthGate() {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  if (!session) return <AuthScreen />;
  return (
    // Keyed by user so switching accounts never shows the previous user's profile.
    <ProfileProvider key={session.user.id}>
      <AppGate />
    </ProfileProvider>
  );
}

function Themed() {
  const { scheme } = useThemePreference();
  const colors = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
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

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <Themed />
    </ThemePreferenceProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
