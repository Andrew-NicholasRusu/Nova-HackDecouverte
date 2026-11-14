import { StyleSheet } from 'react-native';

import { Fonts, Typography } from '@/styles/theme';

export const styles = StyleSheet.create({
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
