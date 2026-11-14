import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { ThemeColor } from '@/styles/theme';

import { styles } from './themed-text.styles';

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
