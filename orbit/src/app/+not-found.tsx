import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Shown for any address the app does not have. */
export default function NotFound() {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Icon name="travel-explore" size="xl" color="accentLink" />
      <ThemedText type="displaySmall" accessibilityRole="header">
        Off the map
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.text}>
        That page does not exist. Head back home and pick up where you left off.
      </ThemedText>
      <Button label="Go to Home" icon="home" onPress={() => router.replace('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  text: { textAlign: 'center' },
});
