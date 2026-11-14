import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SEG_WIDTH = Spacing.three + Spacing.one;
const SEG_HEIGHT = Spacing.one + Spacing.half;

/** Three-step meter: 1 segment = good, 2 = busy, 3 = full. Colour carries the same meaning as the label next to it. */
export function LevelMeter({ filled, tone }: { filled: 1 | 2 | 3; tone: 'success' | 'warning' | 'danger' }) {
  const theme = useTheme();
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no">
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[styles.seg, { backgroundColor: i <= filled ? theme[tone] : theme.backgroundSelected }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.half + Spacing.half },
  seg: { width: SEG_WIDTH, height: SEG_HEIGHT, borderRadius: Radius.pill },
});
