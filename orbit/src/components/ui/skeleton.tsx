import { useEffect, useState } from 'react';
import { Animated, type DimensionValue, type ViewStyle } from 'react-native';

import { Motion, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { width?: DimensionValue; height?: number; style?: ViewStyle };

/** Pulsing placeholder block for loading states. */
export function Skeleton({ width = '100%', height = 16, style }: Props) {
  const theme = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: Motion.slow * 2, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: Motion.slow * 2, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      style={[
        { width, height, opacity, borderRadius: Radius.sm, backgroundColor: theme.backgroundSelected },
        style,
      ]}
    />
  );
}
