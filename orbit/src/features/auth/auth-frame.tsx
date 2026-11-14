import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { HERO_FOCUS, HERO_PHOTO, HERO_PHOTO_ALT } from '@/constants/images';
import { AuthFormWidth, FixedColors, Size, Spacing, TouchTarget } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';

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

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  photo: { flex: 1, justifyContent: 'flex-end', padding: Spacing.six, backgroundColor: FixedColors.shell },
  photoCopy: { maxWidth: Size.copyMax },
  formWrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.three },
  form: { width: '100%', maxWidth: AuthFormWidth, gap: Spacing.four },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  logo: { width: TouchTarget + Spacing.two, height: TouchTarget + Spacing.two, borderRadius: Spacing.three, backgroundColor: FixedColors.shellActive, alignItems: 'center', justifyContent: 'center' },
});
