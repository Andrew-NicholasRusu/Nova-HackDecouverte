import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { courseColor } from '@/lib/schedule/colors';
import { countOccurrences } from '@/lib/schedule/recurrence';
import { formatDateLabel, weekdayLabel } from '@/lib/schedule/time';
import type { ClassEvent, Occurrence } from '@/lib/schedule/types';

import { KIND_LABELS } from './defaults';
import { classLocation, classTitle } from './occurrence-card';
import { useSchedule } from './schedule-provider';

type Props = {
  occurrence: Occurrence<ClassEvent>;
  onClose: () => void;
  onEditSeries: (event: ClassEvent) => void;
  onEditThisDate: (occurrence: Occurrence<ClassEvent>) => void;
};

function confirm(title: string, message: string, action: string, run: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) run();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: action, style: 'destructive', onPress: run },
  ]);
}

export function ClassDetails({ occurrence, onClose, onEditSeries, onEditThisDate }: Props) {
  const theme = useTheme();
  const { deleteEvent, skipOccurrence } = useSchedule();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const e = occurrence.event;
  const recurring = e.weekdays.length > 0;
  const location = classLocation(e);

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await task();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const rows: [string, string | null][] = [
    ['Type', `${KIND_LABELS[e.kind]}${e.section ? ` · Section ${e.section}` : ''}`],
    ['Time', `${e.startTime} – ${e.endTime}`],
    ['Where', location],
    [
      recurring ? 'Repeats' : 'Date',
      recurring
        ? `Every ${e.weekdays.map(weekdayLabel).join(', ')} · ${formatDateLabel(e.startDate)} to ${formatDateLabel(e.endDate)} (${countOccurrences(e)} classes)`
        : formatDateLabel(e.startDate),
    ],
    ['Skipped', e.excludedDates.length ? e.excludedDates.map(formatDateLabel).join(', ') : null],
    ['Notes', e.notes],
  ];

  return (
    <Sheet title={classTitle(e)} onClose={onClose} closeLabel="Done">
      <View style={styles.hero}>
        <View style={[styles.swatch, { backgroundColor: courseColor(e) }]} />
        <View style={styles.flex}>
          {e.courseName && e.courseCode ? <ThemedText type="heading">{e.courseName}</ThemedText> : null}
          <ThemedText type="small" themeColor="textSecondary">
            {formatDateLabel(occurrence.date)}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.table, { borderColor: theme.border }]}>
        {rows
          .filter((r): r is [string, string] => !!r[1])
          .map(([label, value]) => (
            <View key={label} style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                {label}
              </ThemedText>
              <ThemedText type="small" style={styles.flex}>
                {value}
              </ThemedText>
            </View>
          ))}
      </View>

      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}

      <Button label={recurring ? 'Edit all classes' : 'Edit class'} onPress={() => onEditSeries(e)} disabled={busy} />
      {recurring ? (
        <>
          <Button
            label="Change only this date"
            variant="secondary"
            onPress={() => onEditThisDate(occurrence)}
            disabled={busy}
          />
          <Button
            label="No class on this date"
            variant="secondary"
            disabled={busy}
            onPress={() =>
              confirm(
                'Skip class',
                `Remove ${classTitle(e)} on ${formatDateLabel(occurrence.date)}? Other weeks are not affected.`,
                'Skip',
                () => void run(() => skipOccurrence(e, occurrence.date)),
              )
            }
          />
        </>
      ) : null}
      <Button
        label="Delete class"
        variant="secondary"
        disabled={busy}
        onPress={() =>
          confirm(
            'Delete class',
            recurring
              ? `Delete every meeting of ${classTitle(e)}? This cannot be undone.`
              : `Delete ${classTitle(e)}? This cannot be undone.`,
            'Delete',
            () => void run(() => deleteEvent(e.id)),
          )
        }
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  swatch: { width: 12, alignSelf: 'stretch', borderRadius: 6, minHeight: 40 },
  flex: { flex: 1 },
  table: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: Spacing.two, gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.three },
  label: { width: 72 },
});
