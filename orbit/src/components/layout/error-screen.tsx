import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';

import { styles } from './error-screen.styles';

/** Last line of defence: a calm screen instead of a blank page if something throws. */
export function ErrorScreen({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={styles.root}>
      <ThemedText type="displaySmall" accessibilityRole="header">
        Something went wrong
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
        {error.message}
      </ThemedText>
      <Button label="Try again" icon="refresh" onPress={retry} />
    </View>
  );
}
