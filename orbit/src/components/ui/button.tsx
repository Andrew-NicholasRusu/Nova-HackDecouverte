import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/themed-text';
import { Opacity, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: IconName;
  /** Icon placed after the label (e.g. an arrow on "View all"). */
  iconEnd?: IconName;
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  icon,
  iconEnd,
  fullWidth,
  disabled,
  style,
  ...rest
}: Props) {
  const theme = useTheme();
  const primary = variant === 'primary';
  const ghost = variant === 'ghost';
  const fg = primary ? theme.accentText : ghost ? theme.accentLink : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered;
        return [
          styles.base,
          fullWidth && styles.full,
          primary && { backgroundColor: theme.accent },
          variant === 'secondary' && {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            borderWidth: 1,
          },
          ghost && styles.ghost,
          hovered && !state.pressed && ghost && { backgroundColor: theme.accentTint },
          hovered && !state.pressed && !ghost && { opacity: Opacity.hover },
          state.pressed && { opacity: Opacity.pressed },
          disabled && { opacity: Opacity.disabled },
          typeof style === 'function' ? style(state) : style,
        ];
      }}
      {...rest}>
      <View style={styles.row}>
        {icon ? <Icon name={icon} size="md" color={fg} /> : null}
        <ThemedText type="smallBold" style={{ color: fg }}>
          {label}
        </ThemedText>
        {iconEnd ? <Icon name={iconEnd} size="md" color={fg} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TouchTarget,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: { paddingHorizontal: Spacing.two },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
