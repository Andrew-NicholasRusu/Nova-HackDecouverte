import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { EmptyState } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { findConflicts } from '@/core/schedule/logic';
import {
  COMPONENT_LABELS,
  COMPONENTS,
  classEventInputSchema,
  normalizeCourseCode,
  type ClassEvent,
  type ClassEventInput,
  type Component,
} from '@/core/schedule/model';
import { termFor, upcomingTerms } from '@/core/schedule/terms';
import { WEEKDAYS, formatTime, localMoment, parseTime, toDbTime } from '@/core/schedule/time';
import { useBuildings } from '@/features/navigator/use-buildings';
import { CLASS_COLORS, classColor, type ClassColor } from '@/features/schedule/class-colors';
import { useSchedule } from '@/features/schedule/schedule-provider';
import { useTheme } from '@/hooks/use-theme';
import { apiGet } from '@/lib/api';
import { useThemePreference } from '@/providers/theme-preference';

type Errors = Partial<Record<keyof ClassEventInput, string>>;

const hhmm = (dbTime: string) => dbTime.slice(0, 5);

export default function ClassEditorScreen() {
  const { id, term } = useLocalSearchParams<{ id?: string; term?: string }>();
  const { state } = useSchedule();
  const existing =
    id && state.status === 'ready' ? state.classes.find((c) => c.id === id) : undefined;

  if (id && state.status === 'ready' && !existing) {
    return (
      <Screen title="Class" back>
        <EmptyState title="Class not found" message="It may have been deleted." actionLabel="Back to schedule" onAction={() => router.replace('/schedule')} />
      </Screen>
    );
  }
  if (id && !existing) return <Screen title="Class" back>{null}</Screen>;

  return <ClassForm key={id ?? 'new'} existing={existing} defaultTerm={term} />;
}

function ClassForm({ existing, defaultTerm }: { existing?: ClassEvent; defaultTerm?: string }) {
  const { state, addMany, update, remove } = useSchedule();
  const theme = useTheme();
  const { scheme } = useThemePreference();
  const buildings = useBuildings();
  const today = localMoment(new Date()).date;

  const initialTerm = existing?.term_label ?? defaultTerm ?? termFor(today).label;
  const termDates = upcomingTerms(today).find((t) => t.label === initialTerm) ?? termFor(today);

  const [code, setCode] = useState(existing?.course_code ?? '');
  const [title, setTitle] = useState(existing?.course_title ?? '');
  const [component, setComponent] = useState<Component>(existing?.component ?? 'LEC');
  const [section, setSection] = useState(existing?.section ?? '');
  const [days, setDays] = useState<number[]>(existing?.days ?? []);
  const [start, setStart] = useState(existing ? hhmm(existing.start_time) : '');
  const [end, setEnd] = useState(existing ? hhmm(existing.end_time) : '');
  const [building, setBuilding] = useState(existing?.building_code ?? '');
  const [room, setRoom] = useState(existing?.room ?? '');
  const [termLabel, setTermLabel] = useState(initialTerm);
  const [startDate, setStartDate] = useState(existing?.start_date ?? termDates.start);
  const [endDate, setEndDate] = useState(existing?.end_date ?? termDates.end);
  const [color, setColor] = useState<string>(existing?.color ?? 'accent');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [lookup, setLookup] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const termOptions = useMemo(() => {
    const labels = new Set([...upcomingTerms(today).map((t) => t.label), initialTerm]);
    return [...labels].map((l) => ({ value: l, label: l }));
  }, [today, initialTerm]);

  const draft: ClassEventInput = {
    term_label: termLabel,
    course_code: code,
    course_title: title,
    component,
    section,
    building_code: building,
    room,
    days,
    start_time: start,
    end_time: end,
    start_date: startDate,
    end_date: endDate,
    color,
    source: existing?.source ?? 'manual',
    notes: notes.trim() ? notes : null,
  };

  // Live conflict preview against the student's other classes.
  const timesValid = !Number.isNaN(parseTime(start)) && !Number.isNaN(parseTime(end));
  const conflictsWith =
    state.status !== 'ready' || !timesValid || days.length === 0
      ? []
      : findConflicts([
          {
            ...draft,
            id: existing?.id ?? '__draft',
            start_time: toDbTime(parseTime(start)),
            end_time: toDbTime(parseTime(end)),
          } as ClassEvent,
          ...state.classes.filter((c) => c.id !== existing?.id),
        ])
          .filter(([a]) => a.id === (existing?.id ?? '__draft'))
          .map(([, b]) => b);

  const knownBuilding =
    buildings.status !== 'ready' || !building.trim() ||
    buildings.buildings.some((b) => b.code === building.trim().toUpperCase());

  async function lookUpCourse() {
    const normalized = normalizeCourseCode(code);
    setCode(normalized);
    setLookup('Looking up…');
    try {
      const results = await apiGet<{ title: string; credits: number | null }[]>(
        `/api/concordia/courses?code=${encodeURIComponent(normalized)}`,
      );
      if (results.length === 0) {
        setLookup(`${normalized} isn't in Concordia's catalog. Check the code, or enter the title yourself.`);
      } else {
        setTitle(results[0].title);
        setLookup(`Found in Concordia's catalog${results[0].credits ? ` · ${results[0].credits} credits` : ''}.`);
      }
    } catch (e) {
      setLookup((e as Error).message);
    }
  }

  async function save() {
    setFormError(null);
    const parsed = classEventInputSchema.safeParse(draft);
    if (!parsed.success) {
      const out: Errors = {};
      for (const issue of parsed.error.issues) out[issue.path[0] as keyof ClassEventInput] ??= issue.message;
      setErrors(out);
      return;
    }
    setErrors({});
    const input: ClassEventInput = {
      ...parsed.data,
      start_time: toDbTime(parseTime(parsed.data.start_time)),
      end_time: toDbTime(parseTime(parsed.data.end_time)),
    };
    setBusy(true);
    const err = existing ? await update(existing.id, input) : await addMany([input]);
    setBusy(false);
    if (err) return setFormError(err);
    router.back();
  }

  async function del() {
    if (!existing) return;
    setBusy(true);
    const err = await remove(existing.id);
    setBusy(false);
    if (err) return setFormError(err);
    router.back();
  }

  const toggleDay = (iso: number) =>
    setDays((d) => (d.includes(iso) ? d.filter((x) => x !== iso) : [...d, iso].sort()));

  return (
    <Screen title={existing ? 'Edit class' : 'Add class'} back maxWidth={640}>
      <Card style={styles.card}>
        <ThemedText type="heading">Course</ThemedText>
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField label="Course code" value={code} onChangeText={setCode} onBlur={() => code && setCode(normalizeCourseCode(code))} autoCapitalize="characters" placeholder="COMP 352" error={errors.course_code} />
          </View>
          <View style={styles.lookupBtn}>
            <Button label="Look up" variant="secondary" onPress={lookUpCourse} disabled={!code.trim()} />
          </View>
        </View>
        {lookup ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {lookup}
          </ThemedText>
        ) : null}
        <TextField label="Course title" value={title} onChangeText={setTitle} placeholder="Data Structures and Algorithms" error={errors.course_title} />
        <View style={styles.field}>
          <ThemedText type="caption" themeColor="textSecondary">Type</ThemedText>
          <Segmented label="Type" options={COMPONENTS.filter((c) => c !== 'OTHER').map((c) => ({ value: c, label: COMPONENT_LABELS[c] }))} value={component} onChange={setComponent} />
        </View>
        <TextField label="Section (optional)" value={section} onChangeText={setSection} autoCapitalize="characters" placeholder="AA" maxLength={10} />
      </Card>

      <Card style={styles.card}>
        <ThemedText type="heading">When</ThemedText>
        <View style={styles.field}>
          <ThemedText type="caption" themeColor="textSecondary">Days</ThemedText>
          <View style={styles.days} accessibilityRole="none">
            {WEEKDAYS.map((w) => {
              const on = days.includes(w.iso);
              return (
                <Pressable
                  key={w.iso}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={w.long}
                  onPress={() => toggleDay(w.iso)}
                  style={[styles.dayChip, { borderColor: on ? theme.accent : theme.border, backgroundColor: on ? theme.accent : theme.background }]}>
                  <ThemedText type="smallBold" style={{ color: on ? theme.accentText : theme.text }}>{w.short}</ThemedText>
                </Pressable>
              );
            })}
          </View>
          {errors.days ? <ThemedText type="caption" themeColor="danger">{errors.days}</ThemedText> : null}
        </View>
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField label="Starts" value={start} onChangeText={setStart} placeholder="09:45" keyboardType="numbers-and-punctuation" error={errors.start_time} hint={!Number.isNaN(parseTime(start)) ? formatTime(parseTime(start)) : '24-hour time'} />
          </View>
          <View style={styles.flex}>
            <TextField label="Ends" value={end} onChangeText={setEnd} placeholder="11:00" keyboardType="numbers-and-punctuation" error={errors.end_time} hint={!Number.isNaN(parseTime(end)) ? formatTime(parseTime(end)) : '24-hour time'} />
          </View>
        </View>
        <View style={styles.field}>
          <ThemedText type="caption" themeColor="textSecondary">Term</ThemedText>
          <Segmented
            label="Term"
            options={termOptions}
            value={termLabel}
            onChange={(t) => {
              setTermLabel(t);
              const d = upcomingTerms(today).find((x) => x.label === t);
              if (d && !existing) {
                setStartDate(d.start);
                setEndDate(d.end);
              }
            }}
          />
        </View>
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField label="First class" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" error={errors.start_date} />
          </View>
          <View style={styles.flex}>
            <TextField label="Last class" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" error={errors.end_date} />
          </View>
        </View>
        <ThemedText type="caption" themeColor="textSecondary">
          Default dates cover the whole term. Adjust them to your first and last class.
        </ThemedText>
      </Card>

      <Card style={styles.card}>
        <ThemedText type="heading">Where</ThemedText>
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField label="Building" value={building} onChangeText={(v) => setBuilding(v.toUpperCase())} autoCapitalize="characters" placeholder="H" maxLength={10} hint={knownBuilding ? undefined : `${building.toUpperCase()} isn't in Concordia's building list.`} />
          </View>
          <View style={styles.flex}>
            <TextField label="Room" value={room} onChangeText={setRoom} placeholder="920" maxLength={20} />
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <ThemedText type="heading">Colour & notes</ThemedText>
        <View style={styles.days}>
          {(Object.keys(CLASS_COLORS) as ClassColor[]).map((c) => (
            <Pressable
              key={c}
              accessibilityRole="radio"
              accessibilityState={{ selected: color === c }}
              accessibilityLabel={CLASS_COLORS[c].label}
              onPress={() => setColor(c)}
              style={[styles.swatch, { backgroundColor: classColor(c, scheme), borderColor: color === c ? theme.text : 'transparent' }]}
            />
          ))}
        </View>
        <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline maxLength={500} style={styles.notes} />
      </Card>

      {conflictsWith.length > 0 && (
        <Card style={[styles.card, { borderColor: theme.warning, borderWidth: 1 }]}>
          <ThemedText type="smallBold" themeColor="warning">Overlaps with</ThemedText>
          {conflictsWith.map((c) => (
            <ThemedText key={c.id} type="small" themeColor="textSecondary">
              {c.course_code} {c.component} · {formatTime(parseTime(c.start_time))}–{formatTime(parseTime(c.end_time))}
            </ThemedText>
          ))}
          <ThemedText type="caption" themeColor="textSecondary">You can still save it.</ThemedText>
        </Card>
      )}

      {formError ? <ThemedText type="small" themeColor="danger" accessibilityRole="alert">{formError}</ThemedText> : null}

      <Button label={busy ? 'Saving…' : existing ? 'Save changes' : 'Add class'} onPress={save} disabled={busy} />
      {existing ? <Button label="Delete class" variant="secondary" onPress={del} disabled={busy} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.four },
  row: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  flex: { flex: 1 },
  field: { gap: Spacing.one },
  lookupBtn: { paddingTop: 20 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  dayChip: {
    minWidth: 48,
    minHeight: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  swatch: { width: 36, height: 36, borderRadius: Radius.pill, borderWidth: 3 },
  notes: { minHeight: 72, textAlignVertical: 'top' },
});
