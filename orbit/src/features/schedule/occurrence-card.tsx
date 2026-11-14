import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { courseColor } from '@/lib/schedule/colors';
import type { ClassEventDraft, Occurrence } from '@/lib/schedule/types';

import { KIND_LABELS } from './defaults';

export function classTitle(e: Pick<ClassEventDraft, 'courseCode' | 'courseName'>): string {
  return e.courseCode || e.courseName || 'Untitled class';
}

export function classLocation(e: Pick<ClassEventDraft, 'buildingCode' | 'room'>): string | null {
  if (e.buildingCode && e.room) return `${e.buildingCode} ${e.room}`;
  return e.buildingCode || e.room || null;
}

type Props<T extends ClassEventDraft> = {
  occurrence: Occurrence<T>;
  conflict?: boolean;
  /** e.g. "In 25m" / "Now" on the dashboard. */
  badge?: string | null;
  onPress?: () => void;
};

/** A class meeting on a given day: time, course, kind, room. */
export function OccurrenceCard<T extends ClassEventDraft>({ occurrence, conflict, badge, onPress }: Props<T>) {
  const theme = useTheme();
  const e = occurrence.event;
  const location = classLocation(e);
  const subtitle = [KIND_LABELS[e.kind], e.section ? `Sec. ${e.section}` : null, location]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${classTitle(e)}, ${e.startTime} to ${e.endTime}${location ? `, ${location}` : ''}${conflict ? ', conflicts with another class' : ''}`}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: conflict ? theme.warning : theme.border },
        conflict && styles.conflictBorder,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.bar, { backgroundColor: courseColor(e) }]} />
      <View style={styles.time}>
        <ThemedText type="smallBold">{e.startTime}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {e.endTime}
        </ThemedText>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.flex}>
            {classTitle(e)}
          </ThemedText>
          {badge ? (
            <ThemedText type="caption" themeColor="accent">
              {badge}
            </ThemedText>
          ) : null}
        </View>
        {e.courseCode && e.courseName ? (
          <ThemedText type="small" numberOfLines={1}>
            {e.courseName}
          </ThemedText>
        ) : null}
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {subtitle}
        </ThemedText>
        {conflict ? (
          <ThemedText type="caption" themeColor="warning">
            Overlaps another class
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minHeight: 64,
    ...Elevation.card,
  },
  conflictBorder: { borderWidth: 1 },
  pressed: { opacity: 0.75 },
  bar: { width: 4 },
  time: { width: 64, paddingVertical: Spacing.two, paddingLeft: Spacing.three, gap: Spacing.half },
  body: { flex: 1, paddingVertical: Spacing.two, paddingRight: Spacing.three, gap: Spacing.half },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
});
