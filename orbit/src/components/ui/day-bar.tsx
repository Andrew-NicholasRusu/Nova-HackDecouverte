import { View } from 'react-native';

import { DAY_BAR } from '@/data/constants';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './day-bar.styles';

/** Every bar shows the same day window (`DAY_BAR`), so rows line up. */
const { from: DAY_FROM, to: DAY_TO } = DAY_BAR;
const SPAN = DAY_TO - DAY_FROM;

type Block = { from: number; to: number };

const pct = (m: number) => `${Math.min(100, Math.max(0, ((m - DAY_FROM) / SPAN) * 100))}%` as const;

/** One person's day as a bar: burgundy = in class, light = free, thin line = now. */
export function DayBar({ blocks, nowMin, label }: { blocks: Block[]; nowMin: number; label: string }) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      {blocks.map((b, i) => (
        <View
          key={i}
          style={[
            styles.block,
            { left: pct(b.from), width: `${Math.max(0, ((Math.min(b.to, DAY_TO) - Math.max(b.from, DAY_FROM)) / SPAN) * 100)}%`, backgroundColor: theme.accent },
          ]}
        />
      ))}
      {nowMin >= DAY_FROM && nowMin <= DAY_TO ? (
        <View style={[styles.now, { left: pct(nowMin), backgroundColor: theme.text }]} />
      ) : null}
    </View>
  );
}
