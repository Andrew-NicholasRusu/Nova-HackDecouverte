import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { MAX_QUICK_ACTIONS, PROFILE_LIMITS } from '@/data/constants';
import { SHARING_LEVELS, type SharingLevel } from '@/data/enums';
import { CAMPUS_NAME, SHARING_HELP, SHARING_LABEL } from '@/data/labels';
import { QUICK_ACTIONS } from '@/data/quick-actions';
import type { Profile, ProfileEdit, ProfileErrors } from '@/data/types';
import { signOut } from '@/features/auth/auth';
import { useAuth } from '@/features/auth/auth-provider';
import { useQuickActions } from '@/features/dashboard/quick-actions';
import { commonSharingLevel } from '@/features/friends/describe';
import { setSharingLevelForAll, useFriends } from '@/features/friends/store';
import { chooseAndUploadAvatar, removeAvatar } from '@/features/profile/avatar';
import { ProfileFields } from '@/features/profile/components/profile-fields';
import { isProfileEdited, reloadProfile, toProfileEdit, updateProfile, useProfileState, validateProfile } from '@/features/profile/use-profile';
import { useClassEvents } from '@/features/schedule/store';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { Opacity } from '@/styles/theme';

import { styles } from './settings-screen.styles';

const LEVEL_OPTIONS = SHARING_LEVELS.map((value) => ({ value, label: SHARING_LABEL[value] }));

function QuickAccessSettings() {
  const theme = useTheme();
  const quick = useQuickActions();
  const full = quick.ids.length >= MAX_QUICK_ACTIONS;
  return (
      <Card>
        <CardHeader icon="bolt" title="Quick Access shortcuts" />
        <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
          Choose up to {MAX_QUICK_ACTIONS} shortcuts for your home screen. {quick.ids.length} of {MAX_QUICK_ACTIONS} selected.
        </ThemedText>
        {QUICK_ACTIONS.map((a) => {
          const on = quick.ids.includes(a.id);
          const index = quick.ids.indexOf(a.id);
          const blocked = !on && full;
          return (
            <View key={a.id} style={styles.optionRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={`${a.label}. ${a.hint}`}
                accessibilityState={{ checked: on, disabled: blocked || (on && quick.ids.length === 1) }}
                disabled={blocked}
                onPress={() => quick.toggle(a.id)}
                style={({ pressed }) => [styles.option, (pressed || blocked) && { opacity: blocked ? Opacity.disabled : Opacity.pressed }]}>
                <View style={[styles.check, { borderColor: on ? theme.accent : theme.border, backgroundColor: on ? theme.accent : 'transparent' }]}>
                  {on ? <Icon name="check" size="sm" color="accentText" /> : null}
                </View>
                <Icon name={a.icon} size="lg" color="accentLink" />
                <View style={styles.optionText}>
                  <ThemedText type="smallBold">{a.label}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {a.hint}
                  </ThemedText>
                </View>
              </Pressable>
              {on && (
                <View style={styles.move}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${a.label} earlier`}
                    disabled={index === 0}
                    onPress={() => quick.move(a.id, -1)}
                    style={[styles.moveBtn, index === 0 && { opacity: Opacity.disabled }]}>
                    <Icon name="arrow-upward" size="md" color="textSecondary" />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${a.label} later`}
                    disabled={index === quick.ids.length - 1}
                    onPress={() => quick.move(a.id, 1)}
                    style={[styles.moveBtn, index === quick.ids.length - 1 && { opacity: Opacity.disabled }]}>
                    <Icon name="arrow-downward" size="md" color="textSecondary" />
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
        <Button label="Reset to default" variant="secondary" icon="restore" onPress={quick.reset} />
      </Card>
  );
}

function ProfileCard() {
  const { session } = useAuth();
  const state = useProfileState();
  const profile = state.profile;
  const schedule = useClassEvents();
  const friends = useFriends();
  const { isMedium } = useLayout();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const name = profile?.display_name || profile?.username || 'Student';

  async function photo(action: 'change' | 'remove') {
    if (!session) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      if (action === 'change') await chooseAndUploadAvatar(session.user.id);
      else await removeAvatar(session.user.id);
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Could not update your picture.');
    }
    setPhotoBusy(false);
  }

  return (
    <>
      <View style={styles.profile}>
        <View style={[styles.profileTop, !isMedium && styles.profileTopStack]}>
          <Avatar name={name} uri={profile?.avatar_url} size="xl" onDark />
          <View style={styles.flex}>
            <ThemedText type="subtitle" style={styles.onShell} numberOfLines={1}>
              {name}
            </ThemedText>
            <ThemedText type="small" style={styles.onShellMuted} numberOfLines={1}>
              {profile?.username ? `@${profile.username}` : session?.user.email}
            </ThemedText>
            <View style={styles.photoActions}>
              <Button label={photoBusy ? 'Uploading…' : profile?.avatar_url ? 'Change photo' : 'Add a photo'} icon="photo-camera" variant="secondary" disabled={photoBusy} onPress={() => photo('change')} />
              {profile?.avatar_url ? <Button label="Remove" variant="ghost" disabled={photoBusy} onPress={() => photo('remove')} /> : null}
            </View>
          </View>
        </View>
        {photoError ? (
          <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
            {photoError}
          </ThemedText>
        ) : null}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <ThemedText type="stat" style={styles.onShell}>
              {schedule.events.length}
            </ThemedText>
            <ThemedText type="caption" style={styles.onShellMuted}>
              classes
            </ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText type="stat" style={styles.onShell}>
              {friends.friends.length}
            </ThemedText>
            <ThemedText type="caption" style={styles.onShellMuted}>
              friends
            </ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText type="smallBold" style={styles.gold}>
              {profile?.preferred_campus ? CAMPUS_NAME[profile.preferred_campus] : 'No campus yet'}
            </ThemedText>
            <ThemedText type="caption" style={styles.onShellMuted}>
              home campus
            </ThemedText>
          </View>
        </View>
      </View>

      {state.status === 'error' ? (
        <Card>
          <ThemedText type="smallBold" themeColor="danger">
            Could not load your profile
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {state.error}
          </ThemedText>
          <Button label="Try again" icon="refresh" variant="secondary" onPress={reloadProfile} />
        </Card>
      ) : null}
      <ProfileForm key={profile?.id ?? 'new'} profile={profile} />
    </>
  );
}

/** Inline profile editor: always available, saves with a visible result. */
function ProfileForm({ profile }: { profile: Profile | null }) {
  const [value, setValue] = useState<ProfileEdit>(() => toProfileEdit(profile));
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const dirty = isProfileEdited(value, profile);

  async function save() {
    const found = validateProfile(value);
    setErrors(found);
    setMessage(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await updateProfile(value);
      setMessage({ text: 'Profile saved.', ok: true });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Could not save your profile.', ok: false });
    }
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader icon="person" title="Your profile" />
      <ProfileFields value={value} onChange={(v) => { setValue(v); setMessage(null); }} errors={errors} showBio />
      <ThemedText type="caption" themeColor="textSecondary" style={styles.right}>
        {(value.bio ?? '').length}/{PROFILE_LIMITS.bio}
      </ThemedText>
      {message ? (
        <ThemedText type="small" themeColor={message.ok ? 'success' : 'danger'} accessibilityRole={message.ok ? undefined : 'alert'} accessibilityLiveRegion="polite">
          {message.text}
        </ThemedText>
      ) : null}
      <Button label={busy ? 'Saving…' : 'Save changes'} icon="check" disabled={busy || !dirty} onPress={save} />
    </Card>
  );
}

function PrivacyCard() {
  const friends = useFriends();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const current = commonSharingLevel(friends.friends);

  async function apply(level: SharingLevel) {
    setBusy(true);
    setMessage(null);
    try {
      await setSharingLevelForAll(friends.friends, level);
      setMessage({ text: `Now sharing: ${SHARING_LABEL[level]} with every friend.`, ok: true });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Could not update sharing.', ok: false });
    }
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader icon="lock" title="Privacy" />
      <ThemedText type="small" themeColor="textSecondary">
        What friends can see of your schedule. You can still set it per friend from the Friends screen.
      </ThemedText>
      {friends.friends.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Add a friend first. New friends start with free/busy times only, never your courses or rooms.
        </ThemedText>
      ) : (
        <>
          <ChoiceChips label="Share my schedule with all friends" options={LEVEL_OPTIONS} value={current} onChange={(l) => !busy && apply(l)} />
          <ThemedText type="caption" themeColor="textSecondary">
            {current ? SHARING_HELP[current] : 'Friends currently have different settings. Pick one to apply it to everyone.'}
          </ThemedText>
        </>
      )}
      {message ? (
        <ThemedText type="small" themeColor={message.ok ? 'success' : 'danger'} accessibilityLiveRegion="polite">
          {message.text}
        </ThemedText>
      ) : null}
    </Card>
  );
}

function AboutCard() {
  return (
    <Card>
      <ThemedText type="caption" themeColor="textSecondary">
        Buildings and floor plans: Concordia Open Data. Lines and seats: reported by students, not official. Your schedule stays private unless you share it.
      </ThemedText>
      <Button label="Sign out" variant="secondary" icon="logout" onPress={signOut} />
    </Card>
  );
}

export function SettingsScreen() {
  const { isWide } = useLayout();
  return (
    <Screen title="Settings" subtitle="Your profile, privacy and home screen">
      <View style={[styles.cols, isWide && styles.colsRow]}>
        <View style={[styles.col, isWide && styles.flex]}>
          <ProfileCard />
          <PrivacyCard />
          <AboutCard />
        </View>
        <View style={[styles.col, isWide && styles.flex]}>
          <QuickAccessSettings />
        </View>
      </View>
    </Screen>
  );
}
