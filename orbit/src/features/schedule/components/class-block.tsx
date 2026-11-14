import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { formatLocation } from './format';
import { courseColor, type ClassInput } from './model';

type Props = {
  event: ClassInput;
  /** Shown under the course line, e.g. "Mon · Wed · Sep 8 → Dec 7". */
  detail?: string;
  status?: 'now' | 'done' | 'conflict';
  onPress?: () => void;
};

const KIND_LABEL: Record<ClassInput['kind'], string> = {
  lecture: 'Lecture',
  tutorial: 'Tutorial',
  lab: 'Lab',
  exam: 'Exam',
  other: 'Other',
};

/** One class in a list: colour bar, time, course, room. Shared by day/week views and import review. */
export function ClassBlock({ event, detail, status, onPress }: Props) {
  const theme = useTheme();
  const color = courseColor(event);

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${event.courseCode} ${KIND_LABEL[event.kind]}, ${event.startTime} to ${event.endTime}, ${formatLocation(event)}`}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.block,
        { backgroundColor: theme.backgroundElement, borderColor: status === 'now' ? color : theme.border },
        status === 'done' && styles.done,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={styles.time}>
        <ThemedText type="smallBold">{event.startTime}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {event.endTime}
        </ThemedText>
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.flex}>
            {event.courseCode}
            {event.title ? (
              <ThemedText type="small" themeColor="textSecondary">
                {'  '}
                {event.title}
              </ThemedText>
            ) : null}
          </ThemedText>
          {status === 'now' ? (
            <ThemedText type="caption" style={{ color }}>
              NOW
            </ThemedText>
          ) : status === 'conflict' ? (
            <ThemedText type="caption" themeColor="warning">
              OVERLAP
            </ThemedText>
          ) : null}
        </View>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {KIND_LABEL[event.kind]}
          {event.section ? ` · ${event.section}` : ''} · {formatLocation(event)}
        </ThemedText>
        {detail ? (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {detail}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    paddingRight: Spacing.three,
    overflow: 'hidden',
  },
  bar: { width: 4, alignSelf: 'stretch', borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  time: { width: 44, alignItems: 'flex-start' },
  body: { flex: 1, gap: Spacing.half },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  done: { opacity: 0.55 },
  pressed: { opacity: 0.75 },
});
