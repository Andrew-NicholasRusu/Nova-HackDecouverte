import { useState } from 'react';

import { AuthFrame } from '@/components/layout/auth-frame';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/ui/themed-text';
import type { Profile, ProfileEdit, ProfileErrors } from '@/data/types';
import { signOut } from '@/features/auth/auth';

import { suggestUsername, updateProfile, validateProfile } from '../use-profile';
import { styles } from './onboarding-screen.styles';
import { ProfileFields } from './profile-fields';

/** Shown once after sign-up, until the student has a username (PLAN.md Milestone 2). */
export function OnboardingScreen({ profile }: { profile: Profile }) {
  const [value, setValue] = useState<ProfileEdit>({
    display_name: profile.display_name,
    username: suggestUsername(profile.display_name),
    bio: profile.bio,
    preferred_campus: profile.preferred_campus,
  });
  const [errors, setErrors] = useState<ProfileErrors>({});
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
      <Button label="Sign out" variant="ghost" onPress={signOut} />
    </AuthFrame>
  );
}
