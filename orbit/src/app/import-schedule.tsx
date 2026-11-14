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
import { parseIcs, type ImportCandidate } from '@/core/schedule/ics';
import { findConflicts } from '@/core/schedule/logic';
import { classEventInputSchema, type ClassEvent, type ClassEventInput } from '@/core/schedule/model';
import { termFor, upcomingTerms } from '@/core/schedule/terms';
import { WEEKDAYS, formatTime, localMoment, parseTime } from '@/core/schedule/time';
import { pickCalendarFile } from '@/features/schedule/read-picked-file';
import { useSchedule } from '@/features/schedule/schedule-provider';
import { useTheme } from '@/hooks/use-theme';

type Row = ImportCandidate & { include: boolean };

const validate = (r: Row) => classEventInputSchema.safeParse(r);

export default function ImportScheduleScreen() {
  const params = useLocalSearchParams<{ term?: string }>();
  const today = localMoment(new Date()).date;
  const { state, addMany } = useSchedule();
  const theme = useTheme();

  const [term, setTerm] = useState(params.term ?? termFor(today).label);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const termOptions = upcomingTerms(today).map((t) => ({ value: t.label, label: t.label }));

  async function choose() {
    setError(null);
    try {
      const file = await pickCalendarFile();
      if (!file) return;
      const parsed = parseIcs(file.text, term);
      setFileName(file.name);
      setRows(parsed.map((c) => ({ ...c, include: validate({ ...c, include: true }).success })));
      if (parsed.length === 0) setError('No events were found in that file.');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const patch = (key: string, p: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));

  // Conflicts among selected rows and with classes already saved.
  const conflictKeys = useMemo(() => {
    const existing = state.status === 'ready' ? state.classes : [];
    const selected = rows.filter((r) => r.include).map((r) => ({ ...r, id: `new:${r.key}` }) as unknown as ClassEvent);
    const keys = new Set<string>();
    for (const [a, b] of findConflicts([...selected, ...existing])) {
      if (a.id.startsWith('new:')) keys.add(a.id.slice(4));
      if (b.id.startsWith('new:')) keys.add(b.id.slice(4));
    }
    return keys;
  }, [rows, state]);

  const selected = rows.filter((r) => r.include);
  const invalid = selected.filter((r) => !validate(r).success);

  async function confirm() {
    setError(null);
    if (invalid.length) {
      setError('Fix or untick the highlighted classes first.');
      return;
    }
    const inputs: ClassEventInput[] = selected.map((r) => {
      const { key: _k, warnings: _w, include: _i, ...rest } = r;
      return { ...(classEventInputSchema.parse(rest) as ClassEventInput), term_label: term };
    });
    setBusy(true);
    const err = await addMany(inputs);
    setBusy(false);
    if (err) return setError(err);
    router.replace('/schedule');
  }

  return (
    <Screen title="Import schedule" back maxWidth={720}>
      <Card style={styles.card}>
        <ThemedText type="small" themeColor="textSecondary">
          Import a calendar (.ics) file, for example one exported from your student portal, Google
          Calendar or Outlook. You&apos;ll review every class before anything is saved.
        </ThemedText>
        <View style={styles.field}>
          <ThemedText type="caption" themeColor="textSecondary">Add to term</ThemedText>
          <Segmented label="Term" options={termOptions} value={term} onChange={setTerm} />
        </View>
        <Button label={fileName ? 'Choose a different file' : 'Choose .ics file'} variant={fileName ? 'secondary' : 'primary'} onPress={choose} />
        {fileName ? <ThemedText type="caption" themeColor="textSecondary">{fileName} · {rows.length} events found</ThemedText> : null}
        <ThemedText type="caption" themeColor="textSecondary">
          PDF and screenshot import are not available yet.
        </ThemedText>
      </Card>

      {error ? <ThemedText type="small" themeColor="danger" accessibilityRole="alert">{error}</ThemedText> : null}

      {fileName && rows.length === 0 && !error ? (
        <EmptyState title="Nothing to import" message="That file has no events." />
      ) : null}

      {rows.map((r) => {
        const check = validate(r);
        const firstError = check.success ? null : check.error.issues[0];
        const conflict = r.include && conflictKeys.has(r.key);
        return (
          <Card key={r.key} style={[styles.card, { borderColor: !check.success && r.include ? theme.danger : theme.border }]}>
            <View style={styles.rowHead}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: r.include }}
                accessibilityLabel={`Import ${r.course_code || 'this event'}`}
                onPress={() => patch(r.key, { include: !r.include })}
                style={[styles.check, { borderColor: theme.accent, backgroundColor: r.include ? theme.accent : 'transparent' }]}>
                {r.include ? <ThemedText type="smallBold" style={{ color: theme.accentText }}>✓</ThemedText> : null}
              </Pressable>
              <View style={styles.flex}>
                <ThemedText type="smallBold">
                  {r.course_code || 'Unknown course'} · {r.component}
                </ThemedText>
                {r.course_title ? <ThemedText type="small">{r.course_title}</ThemedText> : null}
                <ThemedText type="caption" themeColor="textSecondary">
                  {r.days.map((d) => WEEKDAYS[d - 1].short).join(', ')} · {formatTime(parseTime(r.start_time))}–{formatTime(parseTime(r.end_time))} · {[r.building_code, r.room].filter(Boolean).join(' ') || 'No location'}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {r.start_date} → {r.end_date}
                </ThemedText>
              </View>
            </View>

            {r.include && !r.course_code ? (
              <TextField label="Course code" value={r.course_code} onChangeText={(v) => patch(r.key, { course_code: v })} autoCapitalize="characters" placeholder="COMP 352" />
            ) : null}
            {r.warnings.map((w) => (
              <ThemedText key={w} type="caption" themeColor="warning">⚠ {w}</ThemedText>
            ))}
            {conflict ? <ThemedText type="caption" themeColor="danger">Overlaps another class.</ThemedText> : null}
            {r.include && firstError ? (
              <ThemedText type="caption" themeColor="danger">{firstError.message}</ThemedText>
            ) : null}
          </Card>
        );
      })}

      {rows.length > 0 ? (
        <Button
          label={busy ? 'Importing…' : `Import ${selected.length} ${selected.length === 1 ? 'class' : 'classes'}`}
          onPress={confirm}
          disabled={busy || selected.length === 0}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two, padding: Spacing.three, borderWidth: 1 },
  field: { gap: Spacing.one },
  flex: { flex: 1, gap: Spacing.half },
  rowHead: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  check: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
