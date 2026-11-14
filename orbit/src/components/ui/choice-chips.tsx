import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Opacity } from '@/styles/theme';

import { styles } from './choice-chips.styles';

type Props<T extends string | number> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
};

/** Single-choice chip row (radio semantics). Selected chip uses the accent fill. */
export function ChoiceChips<T extends string | number>({ label, options, value, onChange }: Props<T>) {
  const theme = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? theme.accent : theme.backgroundSelected,
              },
              pressed && { opacity: Opacity.pressed },
            ]}>
            <ThemedText type="smallBold" style={{ color: selected ? theme.accentText : theme.text }}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
