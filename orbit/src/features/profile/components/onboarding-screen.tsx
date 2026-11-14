import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthFrame } from '@/features/auth/auth-frame';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

import { ProfileFields } from './profile-fields';
import { updateProfile, validateProfile, type Profile, type ProfileEdit } from './use-profile';

function suggestUsername(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
}

/** Shown once after sign-up, until the student has a username (PLAN.md Milestone 2). */
export function OnboardingScreen({ profile }: { profile: Profile }) {
  const [value, setValue] = useState<ProfileEdit>({
    display_name: profile.display_name,
    username: suggestUsername(profile.display_name),
    bio: profile.bio,
    preferred_campus: profile.preferred_campus,
  });
  const [errors, setErrors] = useState<ReturnType<typeof validateProfile>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const found = validateProfile(value);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile.');
      setBusy(false);
    }
  }

  return (
    <AuthFrame>
      <Card style={styles.card}>
        <ThemedText type="subtitle" accessibilityRole="header">
          Welcome! Two quick things
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Pick a name and username so classmates can find you. You can add a photo later in Settings.
        </ThemedText>
        <ProfileFields value={value} onChange={setValue} errors={errors} />
        {error ? (
          <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
            {error}
          </ThemedText>
        ) : null}
        <Button label={busy ? 'Saving…' : 'Continue'} icon="arrow-forward" onPress={submit} disabled={busy} />
      </Card>
      <Button label="Sign out" variant="ghost" onPress={() => supabase.auth.signOut()} />
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.four },
});
