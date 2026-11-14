import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Sheet } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { COURSE_COLORS, courseColor } from '@/lib/schedule/colors';
import { formatDateLabel, isoWeekday, isValidDate, weekdayLabel } from '@/lib/schedule/time';
import { CLASS_KINDS, WEEKDAYS, type ClassEventDraft, type Weekday } from '@/lib/schedule/types';
import { hasErrors, normalizeDraft, validateClassDraft, type DraftErrors } from '@/lib/schedule/validate';
import { useTheme } from '@/hooks/use-theme';

import { KIND_LABELS } from './defaults';

type Props = {
  title: string;
  initial: ClassEventDraft;
  saveLabel?: string;
  onSave: (draft: ClassEventDraft) => Promise<void> | void;
  onClose: () => void;
  /** Extra actions under the form (e.g. delete). */
  children?: React.ReactNode;
};

/** Create/edit form for one class (manual entry and import review). */
export function ClassForm({ title, initial, saveLabel = 'Save class', onSave, onClose, children }: Props) {
  const theme = useTheme();
  const [draft, setDraft] = useState<ClassEventDraft>(initial);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recurring, setRecurringState] = useState(initial.weekdays.length > 0);

  const set = <K extends keyof ClassEventDraft>(key: K, value: ClassEventDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function toggleDay(day: Weekday) {
    set(
      'weekdays',
      draft.weekdays.includes(day)
        ? draft.weekdays.filter((d) => d !== day)
        : [...draft.weekdays, day].sort((a, b) => a - b),
    );
  }

  function setRecurring(next: boolean) {
    if (next === recurring) return;
    setRecurringState(next);
    // Default a new series to the original date's weekday.
    if (next && draft.weekdays.length === 0 && isValidDate(draft.startDate)) {
      set('weekdays', [isoWeekday(draft.startDate)]);
    }
  }

  async function save() {
    const normalized = normalizeDraft(
      recurring ? draft : { ...draft, weekdays: [], endDate: draft.startDate, excludedDates: [] },
    );
    const found = validateClassDraft(normalized);
    if (recurring && normalized.weekdays.length === 0) found.weekdays = 'Pick at least one day, or choose One time.';
    setErrors(found);
    if (hasErrors(found)) return;
    setBusy(true);
    setSaveError(null);
    try {
      await onSave(normalized);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const color = courseColor(draft);

  return (
    <Sheet
      title={title}
      onClose={onClose}
      footer={<Button label={busy ? 'Saving…' : saveLabel} onPress={save} disabled={busy} />}>
      <Section title="Course">
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label="Course code"
              value={draft.courseCode}
              onChangeText={(v) => set('courseCode', v)}
              autoCapitalize="characters"
              placeholder="COMP 248"
              maxLength={20}
            />
          </View>
          <View style={styles.flex}>
            <TextField
              label="Section"
              value={draft.section ?? ''}
              onChangeText={(v) => set('section', v)}
              autoCapitalize="characters"
              placeholder="AA"
              maxLength={20}
            />
          </View>
        </View>
        <FieldError message={errors.courseCode ?? errors.section} />
        <TextField
          label="Course name"
          value={draft.courseName}
          onChangeText={(v) => set('courseName', v)}
          placeholder="Object-Oriented Programming I"
          maxLength={120}
        />
        <View style={styles.chips}>
          {CLASS_KINDS.map((k) => (
            <Chip key={k} label={KIND_LABELS[k]} selected={draft.kind === k} onPress={() => set('kind', k)} />
          ))}
        </View>
      </Section>

      <Section title="When">
        <View style={styles.chips}>
          <Chip label="Weekly" selected={recurring} onPress={() => setRecurring(true)} />
          <Chip label="One time" selected={!recurring} onPress={() => setRecurring(false)} />
        </View>
        {recurring ? (
          <View style={styles.chips} accessibilityLabel="Days of the week">
            {WEEKDAYS.map((d) => (
              <Chip
                key={d}
                label={weekdayLabel(d)}
                selected={draft.weekdays.includes(d)}
                onPress={() => toggleDay(d)}
              />
            ))}
          </View>
        ) : null}
        <FieldError message={errors.weekdays} />
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label="Starts (HH:MM)"
              value={draft.startTime}
              onChangeText={(v) => set('startTime', v)}
              inputMode="numeric"
              placeholder="10:15"
              maxLength={5}
            />
          </View>
          <View style={styles.flex}>
            <TextField
              label="Ends (HH:MM)"
              value={draft.endTime}
              onChangeText={(v) => set('endTime', v)}
              inputMode="numeric"
              placeholder="11:30"
              maxLength={5}
            />
          </View>
        </View>
        <FieldError message={errors.startTime ?? errors.endTime} />
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label={recurring ? 'First date' : 'Date'}
              value={draft.startDate}
              onChangeText={(v) => set('startDate', v)}
              inputMode="numeric"
              placeholder="YYYY-MM-DD"
              maxLength={10}
            />
          </View>
          {recurring ? (
            <View style={styles.flex}>
              <TextField
                label="Last date"
                value={draft.endDate}
                onChangeText={(v) => set('endDate', v)}
                inputMode="numeric"
                placeholder="YYYY-MM-DD"
                maxLength={10}
              />
            </View>
          ) : null}
        </View>
        <FieldError message={errors.startDate ?? errors.endDate} />
        {recurring && draft.excludedDates.length > 0 ? (
          <View style={styles.skipped}>
            <ThemedText type="caption" themeColor="textSecondary">
              No class on
            </ThemedText>
            <View style={styles.chips}>
              {draft.excludedDates.map((d) => (
                <Chip
                  key={d}
                  label={`${formatDateLabel(d)}  ✕`}
                  accessibilityLabel={`Restore class on ${formatDateLabel(d)}`}
                  onPress={() => set('excludedDates', draft.excludedDates.filter((x) => x !== d))}
                />
              ))}
            </View>
          </View>
        ) : null}
      </Section>

      <Section title="Where">
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label="Building"
              value={draft.buildingCode ?? ''}
              onChangeText={(v) => set('buildingCode', v)}
              autoCapitalize="characters"
              placeholder="H"
              maxLength={10}
            />
          </View>
          <View style={styles.flex}>
            <TextField
              label="Room"
              value={draft.room ?? ''}
              onChangeText={(v) => set('room', v)}
              autoCapitalize="characters"
              placeholder="937"
              maxLength={20}
            />
          </View>
        </View>
        <FieldError message={errors.buildingCode ?? errors.room} />
      </Section>

      <Section title="Colour">
        <View style={styles.chips} accessibilityRole="radiogroup">
          {COURSE_COLORS.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="radio"
              accessibilityLabel={`Colour ${c}`}
              accessibilityState={{ checked: color === c }}
              onPress={() => set('color', c)}
              hitSlop={4}
              style={[
                styles.swatch,
                { backgroundColor: c, borderColor: color === c ? theme.text : 'transparent' },
              ]}
            />
          ))}
        </View>
      </Section>

      <TextField
        label="Notes"
        value={draft.notes ?? ''}
        onChangeText={(v) => set('notes', v)}
        multiline
        maxLength={500}
        style={styles.notes}
      />

      {saveError ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {saveError}
        </ThemedText>
      ) : null}
      {children}
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <ThemedText type="caption" themeColor="danger" accessibilityRole="alert">
      {message}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  skipped: { gap: Spacing.one },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 3 },
  notes: { minHeight: 80, paddingTop: Spacing.two, textAlignVertical: 'top' },
});
