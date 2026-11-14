import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';

type EmptyProps = { title: string; message: string; actionLabel?: string; onAction?: () => void };

export function EmptyState({ title, message, actionLabel, onAction }: EmptyProps) {
  return (
    <Card style={styles.center}>
      <ThemedText type="heading">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
        {message}
      </ThemedText>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </Card>
  );
}

type ErrorProps = { message: string; onRetry?: () => void };

export function ErrorState({ message, onRetry }: ErrorProps) {
  return (
    <Card style={styles.center} accessibilityRole="alert">
      <ThemedText type="heading" themeColor="danger">
        Something went wrong
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
        {message}
      </ThemedText>
      {onRetry ? (
        <View style={styles.action}>
          <Button label="Try again" onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingVertical: Spacing.four },
  text: { textAlign: 'center' },
  action: { marginTop: Spacing.two },
});
