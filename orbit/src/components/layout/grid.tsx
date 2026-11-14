import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

import { styles } from './grid.styles';

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
