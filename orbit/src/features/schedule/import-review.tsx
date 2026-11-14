import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet } from '@/components/ui/sheet';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ClassBlock } from './class-block';
import { ClassForm } from './class-form';
import { calculateScheduleConflicts } from './engine';
import { formatDateLabel, formatDays } from './format';
import type { ImportDraft } from './ics';
import { normalizeClassInput, validateClassInput, type ClassEvent, type ClassInput } from './model';
import { createClasses } from './store';

type Props = {
  fileName: string;
  drafts: ImportDraft[];
  skipped: number;
  existing: ClassEvent[];
  onCancel: () => void;
  onDone: (added: number) => void;
};

type Row = { draft: ImportDraft; include: boolean; duplicate: boolean };

const sameClass = (a: ClassInput, b: ClassInput) =>
  a.courseCode === b.courseCode &&
  a.startTime === b.startTime &&
  a.endTime === b.endTime &&
  a.startDate === b.startDate &&
  a.days.join() === b.days.join();

/**
 * Import review (PLAN.md §2 Module A): every extracted class is shown, editable and
 * removable; nothing is saved until the student confirms.
 */
export function ImportReview({ fileName, drafts, skipped, existing, onCancel, onDone }: Props) {
  const theme = useTheme();
  const [rows, setRows] = useState<Row[]>(() =>
    drafts.map((draft) => {
      const duplicate = existing.some((e) => sameClass(e, draft));
      return { draft, include: !duplicate, duplicate };
    }),
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const included = rows.filter((r) => r.include);
  const invalid = new Set(
    included.filter((r) => Object.keys(validateClassInput(normalizeClassInput(r.draft))).length > 0).map((r) => r.draft.key),
  );
  const overlapping = useMemo(() => {
    const keys = new Set<string>();
    const all: (ClassInput & { key?: string })[] = [...existing, ...rows.filter((r) => r.include).map((r) => r.draft)];
    for (const { a, b } of calculateScheduleConflicts(all)) {
      if (a.key) keys.add(a.key);
      if (b.key) keys.add(b.key);
    }
    return keys;
  }, [existing, rows]);

  const toggle = (key: string) =>
    setRows((rs) => rs.map((r) => (r.draft.key === key ? { ...r, include: !r.include } : r)));

  async function save() {
    if (invalid.size > 0) {
      setError('Some selected classes are missing information. Tap them to fix, or untick them.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createClasses(
        included.map((r) => normalizeClassInput(r.draft)),
        'ics',
      );
      onDone(included.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the classes.');
      setSaving(false);
    }
  }

  const editingRow = rows.find((r) => r.draft.key === editing);

  return (
    <Sheet
      visible
      title="Review import"
      onClose={onCancel}
      footer={
        <View style={styles.footer}>
          <Button
            label={
              saving
                ? 'Adding…'
                : included.length === 0
                  ? 'Select classes to add'
                  : `Add ${included.length} ${included.length === 1 ? 'class' : 'classes'}`
            }
            onPress={save}
            disabled={saving || included.length === 0}
          />
        </View>
      }>
      <ThemedText type="small" themeColor="textSecondary">
        Found {drafts.length} {drafts.length === 1 ? 'class' : 'classes'} in {fileName}
        {skipped > 0 ? ` (${skipped} all-day or cancelled ${skipped === 1 ? 'event' : 'events'} ignored)` : ''}. Check
        each one: tap to edit, untick anything you don&apos;t want. Nothing is saved until you confirm.
      </ThemedText>

      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}

      {rows.length === 0 ? (
        <Card>
          <ThemedText type="heading">No classes found</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            This file has no timed events. Try exporting your schedule again, or add classes manually.
          </ThemedText>
        </Card>
      ) : null}

      {rows.map(({ draft, include, duplicate }) => {
        const notes = [
          ...(duplicate ? ['Already in your schedule.'] : []),
          ...(include && invalid.has(draft.key) ? ['Missing or invalid information — tap to fix.'] : []),
          ...draft.warnings,
        ];
        return (
          <View key={draft.key} style={styles.item}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: include }}
              accessibilityLabel={`Include ${draft.courseCode}`}
              onPress={() => toggle(draft.key)}
              hitSlop={8}
              style={[
                styles.check,
                { borderColor: include ? theme.accent : theme.border, backgroundColor: include ? theme.accent : 'transparent' },
              ]}>
              {include ? (
                <ThemedText type="smallBold" style={{ color: theme.accentText }}>
                  ✓
                </ThemedText>
              ) : null}
            </Pressable>
            <View style={[styles.flex, !include && styles.excluded]}>
              <ClassBlock
                event={draft}
                status={include && overlapping.has(draft.key) ? 'conflict' : undefined}
                detail={`${formatDays(draft.days)} · ${formatDateLabel(draft.startDate, 'short')} → ${formatDateLabel(draft.endDate, 'short')}`}
                onPress={() => setEditing(draft.key)}
              />
              {notes.map((n) => (
                <ThemedText key={n} type="caption" themeColor="warning" style={styles.note}>
                  {n}
                </ThemedText>
              ))}
            </View>
          </View>
        );
      })}

      {editingRow ? (
        <ClassForm
          title="Edit imported class"
          submitLabel="Done"
          initial={editingRow.draft}
          onCancel={() => setEditing(null)}
          onSubmit={(input) => {
            setRows((rs) =>
              rs.map((r) =>
                r.draft.key === editingRow.draft.key
                  ? { ...r, include: true, draft: { ...r.draft, ...input, warnings: [] } }
                  : r,
              ),
            );
            setEditing(null);
          }}
        />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  check: {
    width: 26,
    height: 26,
    marginTop: Spacing.three,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: Spacing.half },
  excluded: { opacity: 0.45 },
  note: { paddingLeft: Spacing.two },
  footer: { width: '100%', maxWidth: 480 },
});
