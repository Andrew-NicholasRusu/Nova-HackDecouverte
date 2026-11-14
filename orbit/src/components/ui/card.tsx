import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Card({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        style,
      ]}
      {...rest}
    />
  );
}

type HeaderProps = {
  icon: IconName;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Marks the card's data as sample/preview data. */
  sample?: boolean;
};

/** Card title row: burgundy icon, heading, optional "View all →" action. */
export function CardHeader({ icon, title, actionLabel, onAction, sample }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.title}>
        <Icon name={icon} size="lg" color="accentLink" />
        <ThemedText type="heading" accessibilityRole="header" style={styles.titleText}>
          {title}
        </ThemedText>
        {sample ? <Pill label="Sample" /> : null}
      </View>
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="ghost" iconEnd="arrow-forward" onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
    ...Elevation.card,
  },
  titleText: { flexShrink: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  title: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two, flexShrink: 1 },
});
