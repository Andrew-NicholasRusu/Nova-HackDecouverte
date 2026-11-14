import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { HERO_FOCUS, HERO_PHOTO, HERO_PHOTO_ALT } from '@/data/images';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { FixedColors } from '@/styles/theme';

import { styles } from './auth-frame.styles';

/** Shared layout for signed-out and first-run screens: Concordia photo beside a centred form. */
export function AuthFrame({ children }: { children: ReactNode }) {
  const { isWide } = useLayout();
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {isWide && (
        <View style={styles.photo}>
          <Image source={HERO_PHOTO} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={HERO_FOCUS} accessibilityLabel={HERO_PHOTO_ALT} />
          <LinearGradient colors={[FixedColors.heroScrimEnd, FixedColors.heroScrimStart]} style={StyleSheet.absoluteFill} />
          <View style={styles.photoCopy}>
            <ThemedText type="display" style={{ color: FixedColors.white }}>
              Your university. Connected.
            </ThemedText>
          </View>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Icon name="trip-origin" size="xl" color={FixedColors.white} />
            </View>
            <ThemedText type="displaySmall" accessibilityRole="header">
              ORBIT
            </ThemedText>
          </View>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}
