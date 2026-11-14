import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { label: string; tone?: 'neutral' | 'gold' | 'accent' };

/** Small status badge. Gold is reserved for highlights and selected states. */
export function Pill({ label, tone = 'neutral' }: Props) {
  const theme = useTheme();
  const bg =
    tone === 'gold' ? theme.gold : tone === 'accent' ? theme.accentTint : theme.backgroundSelected;
  const fg = tone === 'gold' ? theme.onGold : tone === 'accent' ? theme.accentLink : theme.textSecondary;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <ThemedText type="caption" style={{ color: fg }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
});
