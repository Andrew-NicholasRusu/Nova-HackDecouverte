import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import {
  CAMPUSES,
  fieldErrors,
  profileInputSchema,
  type CampusCode,
  type Profile,
  type ProfileInput,
} from '@/features/profile/profile-schema';
import { useProfileState } from '@/providers/profile-provider';

type Props = {
  profile: Profile;
  submitLabel: string;
  showBio?: boolean;
  onSaved?: () => void;
};

/** Profile fields shared by onboarding and settings. Validates with the same rules as the DB. */
export function ProfileForm({ profile, submitLabel, showBio, onSaved }: Props) {
  const { save } = useProfileState();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username ?? '');
  const [campus, setCampus] = useState<CampusCode | null>(profile.preferred_campus);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileInput, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setFormError(null);
    setSaved(false);
    const parsed = profileInputSchema.safeParse({
      display_name: displayName,
      username,
      preferred_campus: campus ?? undefined,
      bio: showBio ? bio : undefined,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    const input = { ...parsed.data, bio: showBio ? parsed.data.bio || null : undefined };
    const err = await save(input as Partial<ProfileInput>);
    setBusy(false);
    if (err) {
      if (err.includes('username')) setErrors({ username: err });
      else setFormError(err);
      return;
    }
    setSaved(true);
    onSaved?.();
  }

  return (
    <View style={styles.form}>
      <TextField
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        autoComplete="name"
        maxLength={60}
        error={errors.display_name}
        hint="Shown to friends."
      />
      <TextField
        label="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={24}
        error={errors.username}
        hint="Friends can find you by it. Lowercase letters, numbers and _."
      />
      <View style={styles.field}>
        <ThemedText type="caption" themeColor="textSecondary">
          Main campus
        </ThemedText>
        <Segmented
          label="Main campus"
          options={CAMPUSES.map((c) => ({ value: c.code, label: c.name }))}
          value={campus}
          onChange={setCampus}
        />
        {errors.preferred_campus ? (
          <ThemedText type="caption" themeColor="danger">
            {errors.preferred_campus}
          </ThemedText>
        ) : null}
      </View>
      {showBio ? (
        <TextField
          label="Bio (optional)"
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={280}
          error={errors.bio}
          style={styles.bio}
        />
      ) : null}

      {formError ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {formError}
        </ThemedText>
      ) : null}
      {saved && !onSaved ? (
        <ThemedText type="small" themeColor="success" accessibilityLiveRegion="polite">
          Saved.
        </ThemedText>
      ) : null}

      <Button label={busy ? 'Saving…' : submitLabel} onPress={submit} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  field: { gap: Spacing.one },
  bio: { minHeight: 88, textAlignVertical: 'top' },
});
