import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { courseColor } from '@/lib/schedule/colors';
import { overlappingOccurrences } from '@/lib/schedule/conflicts';
import { addDays, isoWeekday, timeToMinutes, weekdayLabel } from '@/lib/schedule/time';
import type { ClassEvent, Occurrence } from '@/lib/schedule/types';

import { classTitle } from './occurrence-card';

const HOUR_HEIGHT = 48;
const GUTTER = 36;

type Props = {
  weekStart: string;
  today: string;
  occurrences: Occurrence<ClassEvent>[];
  onSelect: (o: Occurrence<ClassEvent>) => void;
  onSelectDay: (date: string) => void;
};

/** Monday–Sunday time grid. Weekend columns are hidden when empty. */
export function WeekView({ weekStart, today, occurrences, onSelect, onSelectDay }: Props) {
  const theme = useTheme();
  const clashes = overlappingOccurrences(occurrences);

  const allDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const days = allDays.filter(
    (d) => isoWeekday(d) <= 5 || occurrences.some((o) => o.date === d),
  );

  const minutes = occurrences.flatMap((o) => [
    timeToMinutes(o.event.startTime),
    timeToMinutes(o.event.endTime),
  ]);
  const firstHour = Math.min(8, ...minutes.map((m) => Math.floor(m / 60)));
  const lastHour = Math.max(18, ...minutes.map((m) => Math.ceil(m / 60)));
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);
  const height = hours.length * HOUR_HEIGHT;

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <View style={{ width: GUTTER }} />
        {days.map((d) => {
          const isToday = d === today;
          return (
            <Pressable
              key={d}
              style={styles.dayHeader}
              accessibilityRole="button"
              accessibilityLabel={`Show ${weekdayLabel(isoWeekday(d))} ${d}`}
              onPress={() => onSelectDay(d)}>
              <ThemedText type="caption" themeColor={isToday ? 'accent' : 'textSecondary'}>
                {weekdayLabel(isoWeekday(d))}
              </ThemedText>
              <View style={[styles.dateBubble, isToday && { backgroundColor: theme.accent }]}>
                <ThemedText type="smallBold" style={isToday ? { color: theme.accentText } : undefined}>
                  {Number(d.slice(8))}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.grid, { height }]}>
        <View style={{ width: GUTTER }}>
          {hours.map((h) => (
            <ThemedText
              key={h}
              type="caption"
              themeColor="textSecondary"
              style={[styles.hourLabel, { top: (h - firstHour) * HOUR_HEIGHT - 8 }]}>
              {h === firstHour ? '' : `${h}`}
            </ThemedText>
          ))}
        </View>
        {days.map((d) => (
          <View
            key={d}
            style={[
              styles.column,
              { borderColor: theme.border },
              d === today && { backgroundColor: theme.backgroundSelected },
            ]}>
            {hours.map((h) => (
              <View
                key={h}
                style={[styles.hourLine, { top: (h - firstHour) * HOUR_HEIGHT, borderColor: theme.border }]}
              />
            ))}
            {occurrences
              .filter((o) => o.date === d)
              .map((o) => {
                const start = timeToMinutes(o.event.startTime);
                const end = timeToMinutes(o.event.endTime);
                const clash = clashes.has(o);
                const color = courseColor(o.event);
                return (
                  <Pressable
                    key={`${o.event.id}-${o.date}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${classTitle(o.event)}, ${o.event.startTime} to ${o.event.endTime}${clash ? ', conflict' : ''}`}
                    onPress={() => onSelect(o)}
                    style={[
                      styles.block,
                      {
                        top: ((start - firstHour * 60) / 60) * HOUR_HEIGHT,
                        height: Math.max(18, ((end - start) / 60) * HOUR_HEIGHT - 2),
                        backgroundColor: color,
                        borderColor: clash ? theme.warning : color,
                      },
                      clash && styles.clash,
                    ]}>
                    <ThemedText type="caption" numberOfLines={2} style={styles.blockText}>
                      {classTitle(o.event)}
                    </ThemedText>
                  </Pressable>
                );
              })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.two },
  headerRow: { flexDirection: 'row' },
  dayHeader: { flex: 1, alignItems: 'center', gap: Spacing.half, minHeight: 44 },
  dateBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row' },
  hourLabel: { position: 'absolute', right: Spacing.one },
  column: { flex: 1, borderLeftWidth: StyleSheet.hairlineWidth, position: 'relative' },
  hourLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth },
  block: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 3,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  clash: { borderWidth: 2, borderStyle: 'dashed' },
  blockText: { color: '#FFFFFF', fontWeight: '600', fontSize: 10, lineHeight: 12 },
});
