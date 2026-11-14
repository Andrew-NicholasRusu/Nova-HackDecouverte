import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

/** Row of cards that stacks to a column when `row` is false. `weights` set relative widths. */
export function Grid({ row, weights, children }: { row: boolean; weights?: number[]; children: ReactNode }) {
  return (
    <View style={[styles.grid, row ? styles.row : styles.column]}>
      {Children.toArray(children).map((child, i) => (
        <View key={i} style={row ? { flex: weights?.[i] ?? 1 } : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  column: { flexDirection: 'column' },
});
