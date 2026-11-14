import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Spacing } from '@/constants/theme';
import { ProfileForm } from '@/features/profile/profile-form';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { useProfile } from '@/providers/profile-provider';
import { useThemePreference, type ThemePreference } from '@/providers/theme-preference';

const APPEARANCE: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const profile = useProfile();
  const { session } = useAuth();
  const { preference, setPreference } = useThemePreference();

  return (
    <Screen title="Settings" back maxWidth={640}>
      <Card style={styles.card}>
        <View style={styles.identity}>
          <Avatar name={profile?.display_name} size={56} />
          <View style={styles.flex}>
            <ThemedText type="heading">{profile?.display_name || 'Your profile'}</ThemedText>
            {profile?.username ? (
              <ThemedText type="small" themeColor="textSecondary">
                @{profile.username}
              </ThemedText>
            ) : null}
          </View>
        </View>
        {profile ? <ProfileForm profile={profile} submitLabel="Save profile" showBio /> : null}
      </Card>

      <Card style={styles.card}>
        <ThemedText type="heading">Appearance</ThemedText>
        <Segmented
          label="Appearance"
          options={APPEARANCE}
          value={preference}
          onChange={setPreference}
        />
        <ThemedText type="caption" themeColor="textSecondary">
          Saved on this device.
        </ThemedText>
      </Card>

      <Card style={styles.card}>
        <ThemedText type="heading">Account</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Signed in as {session?.user.email}. Your email is private and never shown to other
          students.
        </ThemedText>
        <Button label="Sign out" variant="secondary" onPress={() => supabase.auth.signOut()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.four },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
});
