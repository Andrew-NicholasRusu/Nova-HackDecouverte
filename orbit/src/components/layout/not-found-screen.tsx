import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './not-found-screen.styles';

/** Shown for any address the app does not have. */
export function NotFoundScreen() {
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
