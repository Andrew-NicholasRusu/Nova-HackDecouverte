import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { COMPONENT_LABELS, type ClassEvent } from '@/core/schedule/model';
import { formatTime, parseTime } from '@/core/schedule/time';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/providers/theme-preference';

import { classColor } from './class-colors';

type Props = {
  event: ClassEvent;
  conflict?: boolean;
  compact?: boolean;
  onPress?: () => void;
};

export function location(e: Pick<ClassEvent, 'building_code' | 'room'>) {
  return [e.building_code, e.room].filter(Boolean).join(' ') || 'Location not set';
}

/** One class meeting: colour bar, code + title, time, location, conflict flag. */
export function ClassRow({ event, conflict, compact, onPress }: Props) {
  const theme = useTheme();
  const { scheme } = useThemePreference();
  const time = `${formatTime(parseTime(event.start_time))} – ${formatTime(parseTime(event.end_time))}`;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${event.course_code} ${COMPONENT_LABELS[event.component]}, ${time}, ${location(event)}${conflict ? ', conflicts with another class' : ''}`}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: conflict ? theme.danger : theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.bar, { backgroundColor: classColor(event.color, scheme) }]} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ThemedText type="smallBold">
            {event.course_code} · {event.component}
            {event.section ? ` ${event.section}` : ''}
          </ThemedText>
          {conflict ? (
            <ThemedText type="caption" themeColor="danger">
              Conflict
            </ThemedText>
          ) : null}
        </View>
        {!compact && event.course_title ? (
          <ThemedText type="small" numberOfLines={1}>
            {event.course_title}
          </ThemedText>
        ) : null}
        <ThemedText type="caption" themeColor="textSecondary">
          {time} · {location(event)}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    minHeight: 56,
  },
  pressed: { opacity: 0.7 },
  bar: { width: 5 },
  body: { flex: 1, padding: Spacing.two, paddingLeft: Spacing.three, gap: Spacing.half },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
});
