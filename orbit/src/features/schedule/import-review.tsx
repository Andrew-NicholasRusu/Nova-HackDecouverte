import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { courseColor } from '@/lib/schedule/colors';
import { findConflicts, findConflictsWith } from '@/lib/schedule/conflicts';
import { countOccurrences } from '@/lib/schedule/recurrence';
import { formatDateLabel, weekdayLabel } from '@/lib/schedule/time';
import type { ClassEvent, ClassEventDraft, Schedule } from '@/lib/schedule/types';
import { hasErrors, validateClassDraft } from '@/lib/schedule/validate';

import { KIND_LABELS } from './defaults';
import { classLocation, classTitle } from './occurrence-card';

export type ImportItem = { draft: ClassEventDraft; include: boolean };

type Props = {
  fileName: string;
  schedule: Schedule;
  items: ImportItem[];
  warnings: string[];
  existing: ClassEvent[];
  onChange: (items: ImportItem[]) => void;
  onEdit: (index: number) => void;
  onConfirm: (drafts: ClassEventDraft[]) => Promise<void>;
  onClose: () => void;
};

function describeWhen(d: ClassEventDraft): string {
  const time = `${d.startTime}–${d.endTime}`;
  if (d.weekdays.length === 0) return `${formatDateLabel(d.startDate)} · ${time}`;
  return `${d.weekdays.map(weekdayLabel).join(', ')} · ${time} · ${countOccurrences(d)} classes`;
}

/**
 * Review step for imported classes (PLAN.md Module A import workflow):
 * nothing is saved until the student confirms, and they can edit or drop
 * any detected class first.
 */
export function ImportReview({
  fileName,
  schedule,
  items,
  warnings,
  existing,
  onChange,
  onEdit,
  onConfirm,
  onClose,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const included = items.filter((i) => i.include).map((i) => i.draft);
  const invalid = new Set(items.filter((i) => hasErrors(validateClassDraft(i.draft))).map((i) => i.draft));
  const outsideTerm = (d: ClassEventDraft) => d.endDate < schedule.startsOn || d.startDate > schedule.endsOn;

  // Clash notes per draft: against the saved schedule and within the import.
  const clashes = new Map<ClassEventDraft, string[]>();
  const note = (d: ClassEventDraft, text: string) => clashes.set(d, [...(clashes.get(d) ?? []), text]);
  for (const c of findConflictsWith(included, existing)) {
    note(c.candidate, `Overlaps ${classTitle(c.existing)} (already in your schedule) from ${formatDateLabel(c.firstDate)}`);
  }
  for (const c of findConflicts(included)) {
    note(c.a, `Overlaps ${classTitle(c.b)} from ${formatDateLabel(c.firstDate)}`);
    note(c.b, `Overlaps ${classTitle(c.a)} from ${formatDateLabel(c.firstDate)}`);
  }

  const blocking = included.filter((d) => invalid.has(d)).length;

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(included);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const toggle = (index: number) =>
    onChange(items.map((it, i) => (i === index ? { ...it, include: !it.include } : it)));

  return (
    <Sheet
      title="Review import"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          {blocking > 0 ? (
            <ThemedText type="caption" themeColor="danger">
              Fix or remove {blocking} class{blocking === 1 ? '' : 'es'} with missing details first.
            </ThemedText>
          ) : null}
          {error ? (
            <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
              {error}
            </ThemedText>
          ) : null}
          <Button
            label={busy ? 'Saving…' : `Add ${included.length} class${included.length === 1 ? '' : 'es'} to ${schedule.name}`}
            onPress={confirm}
            disabled={busy || included.length === 0 || blocking > 0}
          />
        </View>
      }>
      <ThemedText type="small" themeColor="textSecondary">
        We found {items.length} class{items.length === 1 ? '' : 'es'} in {fileName}. Check each one, then confirm.
        Nothing is added until you do.
      </ThemedText>

      {warnings.length > 0 ? (
        <Card>
          <ThemedText type="smallBold" themeColor="warning">
            Please check
          </ThemedText>
          {warnings.map((w) => (
            <ThemedText key={w} type="caption" themeColor="textSecondary">
              • {w}
            </ThemedText>
          ))}
        </Card>
      ) : null}

      {items.map((item, index) => {
        const d = item.draft;
        const issues = [
          ...(invalid.has(d) ? ['Missing or invalid details. Tap Edit to fix.'] : []),
          ...(outsideTerm(d) ? [`Falls outside ${schedule.name} (${schedule.startsOn} to ${schedule.endsOn}).`] : []),
          ...(item.include ? (clashes.get(d) ?? []) : []),
        ];
        const location = classLocation(d);
        return (
          <Card key={index} style={[styles.item, !item.include && styles.excluded]}>
            <View style={styles.titleRow}>
              <View style={[styles.dot, { backgroundColor: courseColor(d) }]} />
              <ThemedText type="smallBold" style={styles.flex} numberOfLines={1}>
                {classTitle(d)}
                {d.section ? ` · ${d.section}` : ''}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {KIND_LABELS[d.kind]}
              </ThemedText>
            </View>
            {d.courseCode && d.courseName ? <ThemedText type="small">{d.courseName}</ThemedText> : null}
            <ThemedText type="caption" themeColor="textSecondary">
              {describeWhen(d)}
              {location ? ` · ${location}` : ''}
            </ThemedText>
            {issues.map((issue) => (
              <ThemedText key={issue} type="caption" themeColor={invalid.has(d) ? 'danger' : 'warning'}>
                {issue}
              </ThemedText>
            ))}
            <View style={styles.actions}>
              <Chip
                label={item.include ? 'Included' : 'Not included'}
                selected={item.include}
                onPress={() => toggle(index)}
              />
              <Chip label="Edit" onPress={() => onEdit(index)} />
            </View>
          </Card>
        );
      })}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  footer: { gap: Spacing.two },
  item: { gap: Spacing.one },
  excluded: { opacity: 0.55 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 10, height: 10, borderRadius: 5 },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
});
