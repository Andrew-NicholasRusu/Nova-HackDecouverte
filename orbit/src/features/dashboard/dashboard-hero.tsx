import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { campusName } from '@/features/profile/profile-schema';
import { useLayout } from '@/hooks/use-layout';
import type { Profile } from '@/features/profile/profile-schema';

// The hero is a brand surface: always charcoal with light text, in both themes.
const HERO = Colors.dark;

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardHero({ profile }: { profile: Profile }) {
  const { wide } = useLayout();
  const [query, setQuery] = useState('');
  const firstName = profile.display_name.trim().split(/\s+/)[0];
  const campus = campusName(profile.preferred_campus);

  const search = () => {
    const q = query.trim();
    router.push(q ? { pathname: '/navigator', params: { q } } : '/navigator');
  };

  return (
    <View style={[styles.hero, { backgroundColor: HERO.background }, wide && styles.heroWide]}>
      <View style={[styles.topRow, !wide && styles.topRowNarrow]}>
        <View style={[styles.search, { backgroundColor: HERO.backgroundSelected }]}>
          <Icon name="search" size={18} color={HERO.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            returnKeyType="search"
            placeholder="Search buildings…"
            placeholderTextColor={HERO.textSecondary}
            accessibilityLabel="Search buildings"
            style={[styles.searchInput, { color: HERO.text }]}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile and settings"
          onPress={() => router.push('/settings')}>
          <Avatar name={profile.display_name} size={44} />
        </Pressable>
      </View>

      <View style={styles.text}>
        <ThemedText
          type="title"
          accessibilityRole="header"
          style={[styles.greeting, wide && styles.greetingWide, { color: HERO.text }]}>
          {greeting()}
          {firstName ? `, ${firstName}` : ''}
        </ThemedText>
        <ThemedText type="default" style={{ color: HERO.textSecondary }}>
          Your university, in one orbit{campus ? ` · ${campus} campus` : ''}.
        </ThemedText>
      </View>

      {/* Decorative orbit rings in the brand accent. */}
      <View pointerEvents="none" style={[styles.ring, styles.ringLg, { borderColor: HERO.accent }]} />
      <View pointerEvents="none" style={[styles.ring, styles.ringSm, { borderColor: HERO.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.four,
    overflow: 'hidden',
  },
  heroWide: { padding: Spacing.five, minHeight: 220 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, zIndex: 1 },
  topRowNarrow: { justifyContent: 'space-between' },
  search: {
    flex: 1,
    maxWidth: 360,
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    minHeight: 44,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: Spacing.two },
  text: { gap: Spacing.one, zIndex: 1 },
  greeting: { fontSize: 30, lineHeight: 36 },
  greetingWide: { fontSize: 44, lineHeight: 50 },
  ring: { position: 'absolute', borderWidth: 2, borderRadius: 999, opacity: 0.35 },
  ringLg: { width: 340, height: 340, right: -90, bottom: -200 },
  ringSm: { width: 180, height: 180, right: 40, bottom: -110, opacity: 0.25 },
});
