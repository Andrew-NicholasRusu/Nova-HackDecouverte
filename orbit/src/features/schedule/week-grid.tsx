import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Opacity, Radius, Size, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { occurrencesOnDate, type Occurrence } from './engine';
import { formatDateLabel } from './format';
import { addDays, courseColor, type ClassEvent } from './model';

type Props = {
  weekStart: string;
  events: ClassEvent[];
  now: Date;
  today: string;
  conflictIds: Set<string>;
  onOpen: (e: ClassEvent) => void;
  onOpenDay: (date: string) => void;
};

const mins = (d: Date) => d.getHours() * 60 + d.getMinutes();
const hourLabel = (h: number) => `${((h + 11) % 12) + 1} ${h < 12 ? 'AM' : 'PM'}`;

/** Lays out one day's occurrences side by side when they overlap. */
function lanes(occ: Occurrence[]) {
  const sorted = [...occ].sort((a, b) => a.start.getTime() - b.start.getTime());
  return sorted.map((o) => {
    const group = sorted.filter((x) => x.start < o.end && x.end > o.start);
    return { o, lane: group.indexOf(o), of: group.length };
  });
}

/** Week at a glance: one column per day, classes as time-sized blocks. */
export function WeekGrid({ weekStart, events, now, today, conflictIds, onOpen, onOpenDay }: Props) {
  const theme = useTheme();
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(weekStart, i));
  const byDay = days.map((d) => occurrencesOnDate(events, d));
  // Weekends only appear when something is scheduled on them.
  const shown = days.map((_, i) => i < 5 || byDay[i].length > 0);
  const all = byDay.flat();
  const first = all.length ? Math.min(...all.map((o) => mins(o.start))) : 8 * 60;
  const last = all.length ? Math.max(...all.map((o) => mins(o.end))) : 17 * 60;
  const from = Math.max(7, Math.floor(first / 60) - (first % 60 === 0 ? 0 : 0)) * 60;
  const to = Math.min(23, Math.ceil(last / 60)) * 60;
  const hours = Array.from({ length: (to - from) / 60 }, (_, i) => from / 60 + i);
  const height = (to - from) * (Size.hourHeight / 60);
  const nowMin = mins(now);

  return (
    <View style={[styles.wrap, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <View style={styles.row}>
        <View style={styles.gutter} />
        {days.map((d, i) =>
          shown[i] ? (
            <Pressable
              key={d}
              accessibilityRole="button"
              accessibilityLabel={`Open ${formatDateLabel(d)}`}
              onPress={() => onOpenDay(d)}
              style={[styles.head, d === today && { backgroundColor: theme.accentTint }]}>
              <ThemedText type="caption" themeColor={d === today ? 'accentLink' : 'textSecondary'}>
                {formatDateLabel(d, 'short').split(',')[0].toUpperCase()}
              </ThemedText>
              <ThemedText type="smallBold" themeColor={d === today ? 'accentLink' : 'text'}>
                {formatDateLabel(d, 'short').split(' ').slice(-1)[0]}
              </ThemedText>
            </Pressable>
          ) : null,
        )}
      </View>
      <View style={styles.row}>
        <View style={[styles.gutter, { height }]}>
          {hours.map((h) => (
            <ThemedText key={h} type="caption" themeColor="textSecondary" style={[styles.hour, { top: (h * 60 - from) * (Size.hourHeight / 60) }]}>
              {hourLabel(h)}
            </ThemedText>
          ))}
        </View>
        {days.map((d, i) =>
          shown[i] ? (
            <View key={d} style={[styles.col, { height, borderLeftColor: theme.border }, d === today && { backgroundColor: theme.accentTint }]}>
              {hours.map((h) => (
                <View key={h} style={[styles.line, { top: (h * 60 - from) * (Size.hourHeight / 60), backgroundColor: theme.border }]} />
              ))}
              {lanes(byDay[i]).map(({ o, lane, of }, k) => {
                const color = courseColor(o.event);
                const top = (mins(o.start) - from) * (Size.hourHeight / 60);
                const h = Math.max(Size.hourHeight / 2, (mins(o.end) - mins(o.start)) * (Size.hourHeight / 60) - 2);
                const conflict = conflictIds.has(o.event.id);
                const active = o.start <= now && o.end > now;
                return (
                  <Pressable
                    key={`${o.event.id}-${k}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${o.event.courseCode}, ${o.event.startTime} to ${o.event.endTime}${o.event.room ? `, ${o.event.buildingCode} ${o.event.room}` : ''}${conflict ? ', overlaps another class' : ''}`}
                    onPress={() => onOpen(o.event)}
                    style={(s) => [
                      styles.block,
                      {
                        top,
                        height: h,
                        left: `${(lane / of) * 100}%`,
                        width: `${100 / of}%`,
                        backgroundColor: `${color}2E`,
                        borderColor: conflict ? theme.warning : color,
                        borderWidth: active || conflict ? 2 : 1,
                      },
                      (s as { hovered?: boolean }).hovered && { backgroundColor: `${color}55` },
                      s.pressed && { opacity: Opacity.pressed },
                    ]}>
                    <ThemedText type="caption" style={styles.code} numberOfLines={1}>
                      {o.event.courseCode}
                    </ThemedText>
                    {h >= Size.hourHeight ? (
                      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                        {o.event.startTime} · {o.event.buildingCode} {o.event.room}
                      </ThemedText>
                    ) : null}
                  </Pressable>
                );
              })}
              {d === today && nowMin >= from && nowMin <= to ? (
                <View style={[styles.now, { top: (nowMin - from) * (Size.hourHeight / 60), backgroundColor: theme.accentLink }]} />
              ) : null}
            </View>
          ) : null,
        )}
      </View>
    </View>
  );
}

const GUTTER = Spacing.six - Spacing.three;
const styles = StyleSheet.create({
  wrap: { borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', padding: Spacing.two },
  row: { flexDirection: 'row' },
  gutter: { width: GUTTER, position: 'relative' },
  hour: { position: 'absolute', right: Spacing.two, transform: [{ translateY: -Spacing.two }] },
  head: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: Radius.md },
  col: { flex: 1, position: 'relative', borderLeftWidth: StyleSheet.hairlineWidth },
  line: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  block: { position: 'absolute', borderRadius: Radius.sm, paddingHorizontal: Spacing.one + Spacing.half, paddingVertical: Spacing.half, overflow: 'hidden' },
  code: {},
  now: { position: 'absolute', left: 0, right: 0, height: 2 },
});
