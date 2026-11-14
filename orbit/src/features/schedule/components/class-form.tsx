import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Sheet } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import {
  CLASS_KINDS,
  COURSE_COLORS,
  courseColor,
  normalizeClassInput,
  validateClassInput,
  WEEKDAY_SHORT,
  WEEKDAYS,
  type ClassInput,
  type ClassInputErrors,
} from './model';

type Props = {
  title: string;
  initial: ClassInput;
  submitLabel?: string;
  onCancel: () => void;
  /** Save the class. Throw to show an error and keep the form open. */
  onSubmit: (input: ClassInput) => Promise<void> | void;
  onDelete?: () => Promise<void>;
};

const KIND_LABEL: Record<ClassInput['kind'], string> = {
  lecture: 'Lecture',
  tutorial: 'Tutorial',
  lab: 'Lab',
  exam: 'Exam',
  other: 'Other',
};

function FieldError({ message }: { message?: string }) {
  return message ? (
    <ThemedText type="caption" themeColor="danger">
      {message}
    </ThemedText>
  ) : null;
}

/** Add / edit a class. Mount it only while open so it starts from `initial` each time. */
export function ClassForm({ title, initial, submitLabel = 'Save', onCancel, onSubmit, onDelete }: Props) {
  const theme = useTheme();
  const [form, setForm] = useState<ClassInput>(initial);
  const [errors, setErrors] = useState<ClassInputErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof ClassInput>(key: K, value: ClassInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function submit() {
    const input = normalizeClassInput(form);
    const found = validateClassInput(input);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setSaveError('Check the highlighted fields.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await onSubmit(input);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save this class.');
      setSaving(false);
    }
  }

  async function remove() {
    if (!onDelete) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    try {
      await onDelete();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not delete this class.');
      setSaving(false);
    }
  }

  const color = courseColor(form);

  return (
    <Sheet
      visible
      title={title}
      onClose={onCancel}
      actionLabel={saving ? 'Saving…' : submitLabel}
      onAction={submit}
      actionDisabled={saving}>
      {saveError ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {saveError}
        </ThemedText>
      ) : null}

      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField
            label="Course code"
            placeholder="COMP 248"
            autoCapitalize="characters"
            value={form.courseCode}
            onChangeText={(v) => set('courseCode', v)}
          />
          <FieldError message={errors.courseCode} />
        </View>
        <View style={styles.narrow}>
          <TextField
            label="Section"
            placeholder="AA"
            autoCapitalize="characters"
            value={form.section}
            onChangeText={(v) => set('section', v)}
          />
          <FieldError message={errors.section} />
        </View>
      </View>

      <View>
        <TextField
          label="Course name (optional)"
          placeholder="Object-Oriented Programming I"
          value={form.title}
          onChangeText={(v) => set('title', v)}
        />
        <FieldError message={errors.title} />
      </View>

      <View style={styles.group}>
        <ThemedText type="caption" themeColor="textSecondary">
          Type
        </ThemedText>
        <View style={styles.chips}>
          {CLASS_KINDS.map((k) => (
            <Chip key={k} label={KIND_LABEL[k]} selected={form.kind === k} onPress={() => set('kind', k)} />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <ThemedText type="caption" themeColor="textSecondary">
          Days
        </ThemedText>
        <View style={styles.chips}>
          {WEEKDAYS.map((d) => {
            const selected = form.days.includes(d);
            return (
              <Chip
                key={d}
                label={WEEKDAY_SHORT[d]}
                selected={selected}
                onPress={() => set('days', selected ? form.days.filter((x) => x !== d) : [...form.days, d])}
              />
            );
          })}
        </View>
        <FieldError message={errors.days} />
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField
            label="Starts"
            placeholder="08:45"
            inputMode="numeric"
            value={form.startTime}
            onChangeText={(v) => set('startTime', v)}
          />
          <FieldError message={errors.startTime} />
        </View>
        <View style={styles.flex}>
          <TextField
            label="Ends"
            placeholder="10:00"
            inputMode="numeric"
            value={form.endTime}
            onChangeText={(v) => set('endTime', v)}
          />
          <FieldError message={errors.endTime} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.narrow}>
          <TextField
            label="Building"
            placeholder="H"
            autoCapitalize="characters"
            value={form.buildingCode}
            onChangeText={(v) => set('buildingCode', v)}
          />
          <FieldError message={errors.buildingCode} />
        </View>
        <View style={styles.flex}>
          <TextField
            label="Room"
            placeholder="820"
            autoCapitalize="characters"
            value={form.room}
            onChangeText={(v) => set('room', v)}
          />
          <FieldError message={errors.room} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField
            label="First day"
            placeholder="YYYY-MM-DD"
            value={form.startDate}
            onChangeText={(v) => set('startDate', v)}
          />
          <FieldError message={errors.startDate} />
        </View>
        <View style={styles.flex}>
          <TextField
            label="Last day"
            placeholder="YYYY-MM-DD"
            value={form.endDate}
            onChangeText={(v) => set('endDate', v)}
          />
          <FieldError message={errors.endDate} />
        </View>
      </View>

      <View style={styles.group}>
        <ThemedText type="caption" themeColor="textSecondary">
          Colour
        </ThemedText>
        <View style={styles.chips}>
          {COURSE_COLORS.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              accessibilityLabel={`Colour ${c}`}
              accessibilityState={{ selected: color === c }}
              onPress={() => set('color', c)}
              hitSlop={4}
              style={[
                styles.swatch,
                { backgroundColor: c, borderColor: color === c ? theme.text : 'transparent' },
              ]}
            />
          ))}
        </View>
      </View>

      {onDelete ? (
        <View style={styles.delete}>
          <Button
            label={confirmDelete ? 'Tap again to delete this class' : 'Delete class'}
            variant="secondary"
            onPress={remove}
            disabled={saving}
          />
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.three },
  flex: { flex: 1, gap: Spacing.one },
  narrow: { width: 96, gap: Spacing.one },
  group: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  swatch: { width: 32, height: 32, borderRadius: Radius.pill, borderWidth: 3 },
  delete: { marginTop: Spacing.three },
});
