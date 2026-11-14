import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'display'
    | 'displaySmall'
    | 'title'
    | 'stat'
    | 'subtitle'
    | 'heading'
    | 'small'
    | 'smallBold'
    | 'caption'
    | 'link'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const color = theme[themeColor ?? (type === 'link' ? 'accentLink' : 'text')];

  return <Text style={[{ color }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  display: Typography.display,
  displaySmall: Typography.displaySmall,
  stat: Typography.stat,
  title: Typography.title,
  subtitle: Typography.subtitle,
  heading: Typography.heading,
  default: Typography.body,
  small: Typography.small,
  smallBold: Typography.smallBold,
  caption: Typography.caption,
  link: Typography.link,
  code: {
    ...Typography.caption,
    fontFamily: Fonts.mono,
  },
});
