import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { SheetHost } from '@/components/ui/sheet';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { ClassDetails } from '@/features/schedule/class-details';
import { ClassForm } from '@/features/schedule/class-form';
import { blankDraft, oneOffFrom } from '@/features/schedule/defaults';
import { ImportReview, type ImportItem } from '@/features/schedule/import-review';
import { classTitle, OccurrenceCard } from '@/features/schedule/occurrence-card';
import { pickIcsFile } from '@/features/schedule/pick-ics-file';
import { useSchedule } from '@/features/schedule/schedule-provider';
import { TermForm } from '@/features/schedule/term-form';
import { WeekView } from '@/features/schedule/week-view';
import { findConflicts, overlappingOccurrences } from '@/lib/schedule/conflicts';
import { parseIcs } from '@/lib/schedule/ics';
import { calculateFreePeriods } from '@/lib/schedule/insights';
import { expandOccurrences } from '@/lib/schedule/recurrence';
import { addDays, formatDateLabel, formatDuration, startOfWeek, todayIn } from '@/lib/schedule/time';
import type { ClassEvent, ClassEventDraft, Occurrence, Schedule } from '@/lib/schedule/types';

type SheetState =
  | { kind: 'term'; schedule: Schedule | null }
  | { kind: 'new-class'; draft: ClassEventDraft }
  | { kind: 'edit-class'; event: ClassEvent }
  | { kind: 'edit-date'; occurrence: Occurrence<ClassEvent> }
  | { kind: 'details'; occurrence: Occurrence<ClassEvent> }
  | {
      kind: 'import';
      fileName: string;
      items: ImportItem[];
      warnings: string[];
      editing: number | null;
    };

type ViewMode = 'day' | 'week';

export default function ScheduleScreen() {
  const schedule = useSchedule();
  const { active, events, timeZone } = schedule;
  const today = todayIn(timeZone);
  const [mode, setMode] = useState<ViewMode>('day');
  const [date, setDate] = useState(today);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const close = () => setSheet(null);

  const weekStart = startOfWeek(date);
  const from = mode === 'day' ? date : weekStart;
  const to = mode === 'day' ? date : addDays(weekStart, 6);
  const occurrences = useMemo(
    () => expandOccurrences(events, from, to, timeZone),
    [events, from, to, timeZone],
  );
  const conflicts = useMemo(() => findConflicts(events), [events]);

  async function startImport() {
    if (!active) return;
    setActionError(null);
    try {
      const file = await pickIcsFile();
      if (!file) return;
      const { drafts, warnings } = parseIcs(file.text, { timeZone, defaultEndDate: active.endsOn });
      if (drafts.length === 0) {
        setActionError(warnings[0] ?? 'No classes were found in that file.');
        return;
      }
      setSheet({
        kind: 'import',
        fileName: file.name,
        items: drafts.map((draft) => ({ draft, include: true })),
        warnings,
        editing: null,
      });
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  function renderSheet() {
    if (sheet?.kind === 'term') return <TermForm schedule={sheet.schedule} onClose={close} />;
    if (!sheet || !active) return null;
    switch (sheet.kind) {
      case 'new-class':
        return (
          <ClassForm
            title="Add class"
            initial={sheet.draft}
            onClose={close}
            onSave={async (d) => {
              await schedule.addEvents([d]);
              close();
            }}
          />
        );
      case 'edit-class':
        return (
          <ClassForm
            title={`Edit ${classTitle(sheet.event)}`}
            initial={sheet.event}
            onClose={close}
            onSave={async (d) => {
              await schedule.updateEvent(sheet.event.id, d);
              close();
            }}
          />
        );
      case 'edit-date': {
        const { event, date: day } = sheet.occurrence;
        return (
          <ClassForm
            title={`${classTitle(event)} on ${formatDateLabel(day)}`}
            initial={oneOffFrom(event, day)}
            saveLabel="Save this date only"
            onClose={close}
            onSave={async (d) => {
              // Add the replacement first so a failure never loses the class.
              await schedule.addEvents([{ ...d, source: event.source }]);
              await schedule.skipOccurrence(event, day);
              close();
            }}
          />
        );
      }
      case 'details':
        return (
          <ClassDetails
            occurrence={sheet.occurrence}
            onClose={close}
            onEditSeries={(event) => setSheet({ kind: 'edit-class', event })}
            onEditThisDate={(occurrence) => setSheet({ kind: 'edit-date', occurrence })}
          />
        );
      case 'import': {
        const current = sheet;
        if (current.editing !== null) {
          const index = current.editing;
          return (
            <ClassForm
              title="Edit imported class"
              initial={current.items[index]!.draft}
              saveLabel="Done"
              onClose={() => setSheet({ ...current, editing: null })}
              onSave={(d) =>
                setSheet({
                  ...current,
                  editing: null,
                  items: current.items.map((it, i) => (i === index ? { draft: d, include: true } : it)),
                })
              }
            />
          );
        }
        return (
          <ImportReview
            fileName={current.fileName}
            schedule={active}
            items={current.items}
            warnings={current.warnings}
            existing={events}
            onChange={(items) => setSheet({ ...current, items })}
            onEdit={(index) => setSheet({ ...current, editing: index })}
            onClose={close}
            onConfirm={async (drafts) => {
              await schedule.addEvents(drafts);
              close();
            }}
          />
        );
      }
    }
  }

  return (
    <Screen title="Schedule" subtitle={active ? active.name : 'Your classes, in one place'}>
      {schedule.status === 'loading' ? (
        <Card>
          <Skeleton width="40%" height={20} />
          <Skeleton height={56} />
          <Skeleton height={56} />
        </Card>
      ) : schedule.status === 'error' ? (
        <ErrorState message={schedule.message} onRetry={schedule.reload} />
      ) : !active ? (
        <EmptyState
          title="Set up your term"
          message="Create the term you are in now, then add your classes by hand or import a calendar file."
          actionLabel="Create term"
          onAction={() => setSheet({ kind: 'term', schedule: null })}
        />
      ) : (
        <>
          <TermBar
            schedules={schedule.schedules}
            active={active}
            onSwitch={(id) => {
              setActionError(null);
              schedule.switchSchedule(id).catch((e: Error) => setActionError(e.message));
            }}
            onEdit={() => setSheet({ kind: 'term', schedule: active })}
            onNew={() => setSheet({ kind: 'term', schedule: null })}
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <Button
                label="Add class"
                onPress={() => setSheet({ kind: 'new-class', draft: blankDraft(active, date) })}
              />
            </View>
            <View style={styles.flex}>
              <Button label="Import .ics" variant="secondary" onPress={startImport} />
            </View>
          </View>
          {actionError ? (
            <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
              {actionError}
            </ThemedText>
          ) : null}

          {conflicts.length > 0 ? (
            <Card accessibilityRole="alert">
              <ThemedText type="smallBold" themeColor="warning">
                {conflicts.length} schedule conflict{conflicts.length === 1 ? '' : 's'}
              </ThemedText>
              {conflicts.slice(0, 3).map((c) => (
                <ThemedText key={`${c.a.id}-${c.b.id}`} type="caption" themeColor="textSecondary">
                  {classTitle(c.a)} and {classTitle(c.b)} overlap from {formatDateLabel(c.firstDate)}
                  {c.dates > 1 ? ` (${c.dates} times)` : ''}
                </ThemedText>
              ))}
            </Card>
          ) : null}

          <View style={styles.toolbar}>
            <View style={styles.chips}>
              <Chip label="Day" selected={mode === 'day'} onPress={() => setMode('day')} />
              <Chip label="Week" selected={mode === 'week'} onPress={() => setMode('week')} />
            </View>
            <View style={styles.chips}>
              <Chip
                label="‹"
                accessibilityLabel={mode === 'day' ? 'Previous day' : 'Previous week'}
                onPress={() => setDate(addDays(date, mode === 'day' ? -1 : -7))}
              />
              <Chip
                label="Today"
                selected={mode === 'day' ? date === today : weekStart === startOfWeek(today)}
                onPress={() => setDate(today)}
              />
              <Chip
                label="›"
                accessibilityLabel={mode === 'day' ? 'Next day' : 'Next week'}
                onPress={() => setDate(addDays(date, mode === 'day' ? 1 : 7))}
              />
            </View>
          </View>

          <ThemedText type="heading">
            {mode === 'day'
              ? `${date === today ? 'Today · ' : ''}${formatDateLabel(date)}`
              : `Week of ${formatDateLabel(weekStart)}`}
          </ThemedText>

          {date < active.startsOn || date > active.endsOn ? (
            <ThemedText type="caption" themeColor="textSecondary">
              Outside {active.name} ({active.startsOn} to {active.endsOn}).
            </ThemedText>
          ) : null}

          {mode === 'day' ? (
            <DayView
              occurrences={occurrences}
              onSelect={(occurrence) => setSheet({ kind: 'details', occurrence })}
            />
          ) : (
            <Card>
              <WeekView
                weekStart={weekStart}
                today={today}
                occurrences={occurrences}
                onSelect={(occurrence) => setSheet({ kind: 'details', occurrence })}
                onSelectDay={(d) => {
                  setDate(d);
                  setMode('day');
                }}
              />
            </Card>
          )}
        </>
      )}

      <SheetHost onClose={close}>{renderSheet()}</SheetHost>
    </Screen>
  );
}

function DayView({
  occurrences,
  onSelect,
}: {
  occurrences: Occurrence<ClassEvent>[];
  onSelect: (o: Occurrence<ClassEvent>) => void;
}) {
  if (occurrences.length === 0) {
    return <EmptyState title="No classes" message="Nothing scheduled on this day." />;
  }
  const clashes = overlappingOccurrences(occurrences);
  const free = calculateFreePeriods(occurrences.map((o) => o.event));
  return (
    <View style={styles.list}>
      {occurrences.map((o) => (
        <OccurrenceCard
          key={`${o.event.id}-${o.date}`}
          occurrence={o}
          conflict={clashes.has(o)}
          onPress={() => onSelect(o)}
        />
      ))}
      {free.map((f) => (
        <ThemedText key={f.start} type="caption" themeColor="textSecondary">
          Free {f.start}–{f.end} ({formatDuration(f.minutes * 60_000)})
        </ThemedText>
      ))}
    </View>
  );
}

function TermBar({
  schedules,
  active,
  onSwitch,
  onEdit,
  onNew,
}: {
  schedules: Schedule[];
  active: Schedule;
  onSwitch: (id: string) => void;
  onEdit: () => void;
  onNew: () => void;
}) {
  return (
    <View style={styles.chips}>
      {schedules.map((s) => (
        <Chip
          key={s.id}
          label={s.name}
          selected={s.id === active.id}
          onPress={() => s.id !== active.id && onSwitch(s.id)}
        />
      ))}
      <Chip label="Edit term" onPress={onEdit} />
      <Chip label="+ Term" accessibilityLabel="New term" onPress={onNew} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  list: { gap: Spacing.two },
});
