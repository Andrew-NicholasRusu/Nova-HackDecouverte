import { View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './pill.styles';

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
