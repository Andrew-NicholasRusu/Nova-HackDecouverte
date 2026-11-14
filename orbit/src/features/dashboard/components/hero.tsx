import { Image } from 'expo-image';

import { HERO_FOCUS, HERO_PHOTO, HERO_PHOTO_ALT } from '@/constants/images';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { NotificationBell } from '@/features/notifications/notification-bell';
import { AccountMenu } from '@/features/profile/account-menu';
import { SearchBar } from '@/features/search/search-bar';

import { ThemedText } from '@/components/themed-text';
import {
  BadgeSize,
  FixedColors,
  HeroHeight,
  Motion,
  Radius,
  Spacing,
  TouchTarget,
} from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';

type Props = { name?: string };

function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Photo banner: greeting, tagline, search entry, notifications and profile. */
export function Hero({ name }: Props) {
  const { isWide, isMedium } = useLayout();
  const height = isWide ? HeroHeight.wide : HeroHeight.compact;

  return (
    <View style={[styles.hero, { minHeight: height }]}>
      <View style={styles.clip}>
      <Image
        source={HERO_PHOTO}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition={HERO_FOCUS}
        transition={Motion.slow}
        accessibilityLabel={HERO_PHOTO_ALT}
      />
      <LinearGradient
        colors={isMedium ? [FixedColors.heroScrimStart, FixedColors.heroScrimEnd] : [FixedColors.heroScrimEnd, FixedColors.heroScrimStart]}
        start={isMedium ? { x: 0, y: 0.5 } : { x: 0.5, y: 0 }}
        end={isMedium ? { x: 1, y: 0.5 } : { x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      </View>
      <View style={styles.top}>
        <SearchBar />
        <NotificationBell />
        <AccountMenu />
      </View>
      <View style={styles.copy}>
        <ThemedText
          type={isWide ? 'display' : 'displaySmall'}
          accessibilityRole="header"
          style={styles.greeting}>
          {name ? `${greeting()}, ${name}!` : `${greeting()}!`}
        </ThemedText>
        <ThemedText type="default" style={styles.tagline}>
          Your university. Connected.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    // No overflow clipping here: the search dropdown must escape the banner. The photo clips itself.
    zIndex: 20,
    padding: Spacing.four,
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  clip: { ...StyleSheet.absoluteFill, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: FixedColors.shell },
  // Above the greeting block: the search dropdown lives in this row and must win hit-testing.
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.three, zIndex: 30 },
  iconButton: {
    width: TouchTarget,
    height: TouchTarget,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FixedColors.heroGlass,
  },
  badge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two + Spacing.half,
    width: BadgeSize,
    height: BadgeSize,
    borderRadius: BadgeSize / 2,
    backgroundColor: FixedColors.shellActive,
    borderWidth: 2,
    borderColor: FixedColors.white,
  },
  copy: { gap: Spacing.one },
  greeting: { color: FixedColors.white },
  tagline: { color: FixedColors.white },
});
