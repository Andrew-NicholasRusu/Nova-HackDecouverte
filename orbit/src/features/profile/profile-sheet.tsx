import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { chooseAndUploadAvatar, removeAvatar } from '@/lib/avatar';
import { supabase } from '@/lib/supabase';

import { ProfileFields } from './profile-fields';
import { updateProfile, validateProfile, type Profile, type ProfileEdit } from './use-profile';

/** Profile editor: picture, name, username, campus and bio. Mount only while open. */
export function ProfileSheet({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [value, setValue] = useState<ProfileEdit>({
    display_name: profile.display_name,
    username: profile.username,
    bio: profile.bio,
    preferred_campus: profile.preferred_campus,
  });
  const [errors, setErrors] = useState<ReturnType<typeof validateProfile>>({});
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    value.display_name !== profile.display_name ||
    value.username !== profile.username ||
    (value.bio ?? '') !== (profile.bio ?? '') ||
    value.preferred_campus !== profile.preferred_campus;

  async function save() {
    const found = validateProfile(value);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile(value);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile.');
      setBusy(false);
    }
  }

  async function photo(action: 'change' | 'remove') {
    setPhotoBusy(true);
    setError(null);
    try {
      if (action === 'change') await chooseAndUploadAvatar(profile.id);
      else await removeAvatar(profile.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update your picture.');
    }
    setPhotoBusy(false);
  }

  const name = value.display_name || profile.username || 'Student';

  return (
    <Sheet visible title="Edit profile" onClose={onClose} actionLabel={busy ? 'Saving…' : 'Save'} onAction={save} actionDisabled={busy || !dirty}>
      <View style={styles.photo}>
        <Avatar name={name} uri={profile.avatar_url} size="xl" />
        <View style={styles.photoActions}>
          <Button label={photoBusy ? 'Uploading…' : profile.avatar_url ? 'Change photo' : 'Add a photo'} icon="photo-camera" variant="secondary" disabled={photoBusy} onPress={() => photo('change')} />
          {profile.avatar_url ? <Button label="Remove" variant="ghost" disabled={photoBusy} onPress={() => photo('remove')} /> : null}
        </View>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
          JPG, PNG or WebP, up to 2 MB. Friends see it next to your name.
        </ThemedText>
      </View>
      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}
      <ProfileFields value={value} onChange={setValue} errors={errors} showBio />
      <ThemedText type="caption" themeColor="textSecondary" style={styles.right}>
        {(value.bio ?? '').length}/280
      </ThemedText>
      <Button label="Sign out" variant="secondary" icon="logout" onPress={() => supabase.auth.signOut()} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  photo: { alignItems: 'center', gap: Spacing.three },
  photoActions: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap', justifyContent: 'center' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
});
