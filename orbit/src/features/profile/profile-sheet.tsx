import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';

import { ProfileFields } from './profile-fields';
import { updateProfile, validateProfile, type Profile, type ProfileEdit } from './use-profile';

/** Profile & settings editor. Mount only while open. */
export function ProfileSheet({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [value, setValue] = useState<ProfileEdit>({
    display_name: profile.display_name,
    username: profile.username,
    bio: profile.bio,
    preferred_campus: profile.preferred_campus,
  });
  const [errors, setErrors] = useState<ReturnType<typeof validateProfile>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Sheet visible title="Profile" onClose={onClose} actionLabel={busy ? 'Saving…' : 'Save'} onAction={save} actionDisabled={busy}>
      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}
      <ProfileFields value={value} onChange={setValue} errors={errors} showBio />
      <Button label="Sign out" variant="secondary" onPress={() => supabase.auth.signOut()} />
    </Sheet>
  );
}
