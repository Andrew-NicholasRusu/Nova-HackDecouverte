import { router } from 'expo-router';

import { AuthFrame } from '@/components/layout/auth-frame';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';

import { styles } from './logged-out-screen.styles';

/** Shown after signing out (route: /logged-out). */
export function LoggedOutScreen() {
  return (
    <AuthFrame>
      <Card style={styles.card}>
        <Icon name="check-circle" size="xl" color="success" />
        <ThemedText type="subtitle" accessibilityRole="header">
          You are signed out
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Your schedule and friends stay saved to your account. Sign in again to pick up where you left off.
        </ThemedText>
        <Button label="Sign in again" icon="login" onPress={() => router.replace('/login')} />
      </Card>
    </AuthFrame>
  );
}
