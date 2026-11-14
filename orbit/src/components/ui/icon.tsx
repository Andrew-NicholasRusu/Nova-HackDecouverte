import type { ComponentProps } from 'react';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { IconSize, type ThemeColor } from '@/styles/theme';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

type Props = {
  name: IconName;
  size?: keyof typeof IconSize;
  /** Theme colour key, or a literal colour for fixed surfaces (sidebar, hero). */
  color?: ThemeColor | (string & {});
};

/** Decorative icon; hidden from assistive tech (pair with a text label). */
export function Icon({ name, size = 'md', color = 'text' }: Props) {
  const theme = useTheme();
  const resolved = color in theme ? theme[color as ThemeColor] : color;
  return (
    <MaterialIcons
      name={name}
      size={IconSize[size]}
      color={resolved}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
