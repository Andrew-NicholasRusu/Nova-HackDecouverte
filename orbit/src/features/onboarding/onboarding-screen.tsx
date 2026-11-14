import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { ProfileForm } from '@/features/profile/profile-form';
import type { Profile } from '@/features/profile/profile-schema';

/** First-run setup: shown until the student has picked a username and campus. */
export function OnboardingScreen({ profile }: { profile: Profile }) {
  return (
    <Screen back={false} maxWidth={520}>
      <Card style={styles.card}>
        <ThemedText type="caption" themeColor="accent">
          STEP 1 OF 1 · YOUR PROFILE
        </ThemedText>
        <ThemedText type="subtitle" accessibilityRole="header">
          Welcome to ORBIT
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Set up how friends see you and which campus to show first. You can change this later in
          Settings.
        </ThemedText>
        <ProfileForm profile={profile} submitLabel="Continue" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.four, marginTop: Spacing.four },
});
