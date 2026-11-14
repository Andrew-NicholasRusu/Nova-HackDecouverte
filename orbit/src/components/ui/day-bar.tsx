import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Day window shown by every bar, so rows line up: 08:00 to 21:00 in minutes. */
export const DAY_FROM = 8 * 60;
export const DAY_TO = 21 * 60;
const SPAN = DAY_TO - DAY_FROM;
const BAR_HEIGHT = Spacing.three;
const MARKER = 2;

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

const styles = StyleSheet.create({
  track: { height: BAR_HEIGHT, borderRadius: Radius.sm, overflow: 'hidden' },
  block: { position: 'absolute', top: 0, bottom: 0 },
  now: { position: 'absolute', top: -Spacing.half, bottom: -Spacing.half, width: MARKER },
});
