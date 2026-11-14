import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { HERO_FOCUS, HERO_PHOTO, HERO_PHOTO_ALT } from '@/data/images';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { AccountMenu } from '@/features/profile/components/account-menu';
import { SearchBar } from '@/features/search/components/search-bar';
import { useLayout } from '@/hooks/use-layout';
import { FixedColors, HeroHeight, Motion } from '@/styles/theme';

import { styles } from './hero.styles';

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
