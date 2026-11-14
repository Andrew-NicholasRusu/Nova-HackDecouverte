import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/features/auth/auth-provider';

/** Signed-out screens. Only reachable without a session (see the root layout). */
export default function AuthLayout() {
  const { session } = useAuth();
  if (session) return <Redirect href="/" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="logged-out" />
    </Stack>
  );
}
