import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ClassBlock } from '@/features/schedule/class-block';
import { ClassForm } from '@/features/schedule/class-form';
import {
  calculateFreePeriods,
  calculateScheduleConflicts,
  occurrencesOnDate,
  type Occurrence,
} from '@/features/schedule/engine';
import { formatDateLabel, formatDays, formatDuration, useNow } from '@/features/schedule/format';
import { parseIcs, type ImportDraft } from '@/features/schedule/ics';
import { ImportReview } from '@/features/schedule/import-review';
import {
  addDays,
  emptyClassInput,
  startOfWeek,
  toLocalDate,
  type ClassEvent,
} from '@/features/schedule/model';
import { pickCalendarFile } from '@/features/schedule/pick-calendar-file';
import { createClasses, deleteClass, loadClassEvents, updateClass, useClassEvents } from '@/features/schedule/store';

type Editor = { mode: 'new' } | { mode: 'edit'; event: ClassEvent };
type PendingImport = { fileName: string; drafts: ImportDraft[]; skipped: number };

function DayList({
  occurrences,
  now,
  conflictIds,
  onOpen,
}: {
  occurrences: Occurrence[];
  now: Date;
  conflictIds: Set<string>;
  onOpen: (e: ClassEvent) => void;
}) {
  const breaks = calculateFreePeriods(occurrences, 30);
  return (
    <View style={styles.list}>
      {occurrences.map((o, i) => {
        const gap = breaks.find((b) => b.end.getTime() === o.start.getTime());
        const status = o.start <= now && o.end > now ? 'now' : o.end <= now ? 'done' : conflictIds.has(o.event.id) ? 'conflict' : undefined;
        return (
          <View key={`${o.event.id}-${i}`} style={styles.list}>
            {gap && i > 0 ? (
              <ThemedText type="caption" themeColor="textSecondary" style={styles.break}>
                Break · {formatDuration(gap.minutes)}
              </ThemedText>
            ) : null}
            <ClassBlock event={o.event} status={status} onPress={() => onOpen(o.event)} />
          </View>
        );
      })}
    </View>
  );
}

export default function ScheduleScreen() {
  const theme = useTheme();
  const schedule = useClassEvents();
  const now = useNow();
  const today = toLocalDate(now);

  const [view, setView] = useState<'day' | 'week'>('week');
  const [date, setDate] = useState(today);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'danger' } | null>(null);

  const events = schedule.events;
  const conflicts = useMemo(() => calculateScheduleConflicts(events), [events]);
  const conflictIds = useMemo(() => new Set(conflicts.flatMap((c) => [c.a.id, c.b.id])), [conflicts]);

  async function startImport() {
    setNotice(null);
    try {
      const file = await pickCalendarFile();
      if (!file) return;
      const { drafts, skipped } = parseIcs(file.text);
      setPendingImport({ fileName: file.name, drafts, skipped });
    } catch (e) {
      setNotice({ text: e instanceof Error ? e.message : 'Could not read that file.', tone: 'danger' });
    }
  }

  const step = view === 'day' ? 1 : 7;
  const weekStart = startOfWeek(date);
  const rangeLabel =
    view === 'day'
      ? date === today
        ? `Today · ${formatDateLabel(date, 'short')}`
        : formatDateLabel(date)
      : `Week of ${formatDateLabel(weekStart, 'short')}`;

  return (
    <Screen title="Schedule" subtitle="Your classes, in one place">
      <View style={styles.actions}>
        <View style={styles.flex}>
          <Button label="Add class" onPress={() => setEditor({ mode: 'new' })} />
        </View>
        <View style={styles.flex}>
          <Button label="Import .ics" variant="secondary" onPress={startImport} />
        </View>
      </View>

      {notice ? (
        <ThemedText type="small" themeColor={notice.tone} accessibilityRole="alert">
          {notice.text}
        </ThemedText>
      ) : null}

      {schedule.status === 'error' ? <ErrorState message={schedule.error} onRetry={loadClassEvents} /> : null}

      {(schedule.status === 'loading' || schedule.status === 'idle') && events.length === 0 ? (
        <Card>
          <Skeleton width="40%" height={18} />
          <Skeleton />
          <Skeleton width="70%" />
        </Card>
      ) : null}

      {schedule.status === 'ready' && events.length === 0 ? (
        <EmptyState
          title="No classes yet"
          message="Add your classes one by one, or import the .ics calendar file exported from your student portal."
          actionLabel="Import .ics"
          onAction={startImport}
        />
      ) : null}

      {events.length > 0 ? (
        <>
          {conflicts.length > 0 ? (
            <Card style={{ borderColor: theme.warning }} accessibilityRole="alert">
              <ThemedText type="smallBold" themeColor="warning">
                {conflicts.length === 1 ? '1 schedule conflict' : `${conflicts.length} schedule conflicts`}
              </ThemedText>
              {conflicts.map((c) => (
                <ThemedText key={`${c.a.id}-${c.b.id}`} type="small" themeColor="textSecondary">
                  {c.a.courseCode} ({c.a.startTime}–{c.a.endTime}) overlaps {c.b.courseCode} ({c.b.startTime}–
                  {c.b.endTime}) on {formatDays(c.days)}
                </ThemedText>
              ))}
            </Card>
          ) : null}

          <View style={styles.toolbar}>
            <View style={styles.chips}>
              <Chip label="Day" selected={view === 'day'} onPress={() => setView('day')} />
              <Chip label="Week" selected={view === 'week'} onPress={() => setView('week')} />
            </View>
            <View style={styles.chips}>
              <Chip label="‹" accessibilityLabel={`Previous ${view}`} onPress={() => setDate(addDays(date, -step))} />
              <Chip label="Today" selected={date === today} onPress={() => setDate(today)} />
              <Chip label="›" accessibilityLabel={`Next ${view}`} onPress={() => setDate(addDays(date, step))} />
            </View>
          </View>

          <ThemedText type="subtitle">{rangeLabel}</ThemedText>

          {view === 'day' ? (
            (() => {
              const occ = occurrencesOnDate(events, date);
              return occ.length > 0 ? (
                <DayList
                  occurrences={occ}
                  now={now}
                  conflictIds={conflictIds}
                  onOpen={(event) => setEditor({ mode: 'edit', event })}
                />
              ) : (
                <Card>
                  <ThemedText type="small" themeColor="textSecondary">
                    No classes on this day.
                  </ThemedText>
                </Card>
              );
            })()
          ) : (
            [0, 1, 2, 3, 4, 5, 6].map((offset) => {
              const day = addDays(weekStart, offset);
              const occ = occurrencesOnDate(events, day);
              // Hide empty weekends to keep the week compact.
              if (offset >= 5 && occ.length === 0) return null;
              return (
                <View key={day} style={styles.list}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${formatDateLabel(day)}`}
                    onPress={() => {
                      setDate(day);
                      setView('day');
                    }}
                    style={styles.dayHeader}>
                    <ThemedText type="smallBold" themeColor={day === today ? 'accent' : 'text'}>
                      {formatDateLabel(day, 'short')}
                      {day === today ? ' · Today' : ''}
                    </ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {occ.length === 0 ? 'Free' : `${occ.length} ${occ.length === 1 ? 'class' : 'classes'}`}
                    </ThemedText>
                  </Pressable>
                  {occ.length > 0 ? (
                    <DayList
                      occurrences={occ}
                      now={now}
                      conflictIds={conflictIds}
                      onOpen={(event) => setEditor({ mode: 'edit', event })}
                    />
                  ) : null}
                </View>
              );
            })
          )}

          <View style={styles.all}>
            <ThemedText type="subtitle">All classes · {events.length}</ThemedText>
            {events.map((e) => (
              <ClassBlock
                key={e.id}
                event={e}
                status={conflictIds.has(e.id) ? 'conflict' : undefined}
                detail={`${formatDays(e.days)} · ${formatDateLabel(e.startDate, 'short')} → ${formatDateLabel(e.endDate, 'short')}`}
                onPress={() => setEditor({ mode: 'edit', event: e })}
              />
            ))}
          </View>
        </>
      ) : null}

      {editor ? (
        <ClassForm
          title={editor.mode === 'new' ? 'New class' : 'Edit class'}
          initial={editor.mode === 'new' ? emptyClassInput(today) : editor.event}
          onCancel={() => setEditor(null)}
          onSubmit={async (input) => {
            if (editor.mode === 'new') await createClasses([input], 'manual');
            else await updateClass(editor.event.id, input);
            setEditor(null);
          }}
          onDelete={
            editor.mode === 'edit'
              ? async () => {
                  await deleteClass(editor.event.id);
                  setEditor(null);
                }
              : undefined
          }
        />
      ) : null}

      {pendingImport ? (
        <ImportReview
          {...pendingImport}
          existing={events}
          onCancel={() => setPendingImport(null)}
          onDone={(added) => {
            setPendingImport(null);
            setNotice({ text: `Added ${added} ${added === 1 ? 'class' : 'classes'} to your schedule.`, tone: 'success' });
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.two },
  chips: { flexDirection: 'row', gap: Spacing.two },
  list: { gap: Spacing.two },
  break: { textAlign: 'center' },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: Spacing.two },
  all: { gap: Spacing.two, marginTop: Spacing.four },
});
