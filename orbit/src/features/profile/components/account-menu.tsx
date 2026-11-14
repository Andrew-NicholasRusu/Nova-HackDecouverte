import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Icon, type IconName } from '@/components/ui/icon';
import { Popover } from '@/components/ui/popover';
import { Opacity, Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

import { useProfile } from './use-profile';

type Item = { label: string; icon: IconName; run: () => void; danger?: boolean };

/** Avatar button with a quick menu: profile, settings, shortcuts and sign out. */
export function AccountMenu() {
  const theme = useTheme();
  const { session } = useAuth();
  const profile = useProfile();
  const name = profile?.display_name || profile?.username || 'Student';

  const items: Item[] = [
    { label: 'Edit profile and photo', icon: 'person', run: () => router.push('/settings') },
    { label: 'Settings and shortcuts', icon: 'settings', run: () => router.push('/settings') },
    { label: 'Privacy', icon: 'lock', run: () => router.push('/settings') },
    { label: 'Sign out', icon: 'logout', danger: true, run: () => void supabase.auth.signOut() },
  ];

  return (
    <Popover
      width={300}
      renderTrigger={(open, expanded) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`Account menu for ${name}`}
          onPress={open}
          style={({ pressed }) => pressed && { opacity: Opacity.pressed }}>
          <Avatar name={name} uri={profile?.avatar_url} onDark />
        </Pressable>
      )}>
      {(close) => (
        <View>
          <View style={[styles.head, { borderBottomColor: theme.border }]}>
            <Avatar name={name} uri={profile?.avatar_url} size="lg" />
            <View style={styles.flex}>
              <ThemedText type="heading" numberOfLines={1}>
                {name}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                {profile?.username ? `@${profile.username}` : session?.user.email}
              </ThemedText>
            </View>
          </View>
          {items.map((item, i) => (
            <Pressable
              key={item.label}
              accessibilityRole="menuitem"
              accessibilityLabel={item.label}
              onPress={() => {
                close();
                item.run();
              }}
              style={(s) => [
                styles.item,
                i === items.length - 1 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
                (s as { hovered?: boolean }).hovered && { backgroundColor: theme.accentTint },
                s.pressed && { opacity: Opacity.pressed },
              ]}>
              <Icon name={item.icon} size="lg" color={item.danger ? 'danger' : 'accentLink'} />
              <ThemedText type="smallBold" themeColor={item.danger ? 'danger' : 'text'}>
                {item.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </Popover>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  flex: { flex: 1 },
  item: { minHeight: TouchTarget + Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three },
});
