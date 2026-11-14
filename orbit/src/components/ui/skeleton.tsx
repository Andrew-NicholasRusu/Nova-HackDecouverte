import { useEffect, useState } from 'react';
import { Animated, type DimensionValue, type ViewStyle } from 'react-native';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { Motion, Radius } from '@/styles/theme';

type Props = { width?: DimensionValue; height?: number; style?: ViewStyle };

/** Pulsing placeholder block for loading states (static under reduced motion). */
export function Skeleton({ width = '100%', height = 16, style }: Props) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: Motion.slow * 2, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: Motion.slow * 2, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduced]);

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
