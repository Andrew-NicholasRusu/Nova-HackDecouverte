import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { Radius, Spacing } from '@/constants/theme';
import { classesOn, findConflicts, freePeriods } from '@/core/schedule/logic';
import type { ClassEvent } from '@/core/schedule/model';
import { upcomingTerms } from '@/core/schedule/terms';
import { WEEKDAYS, addDays, formatTime, startOfWeek, weekdayOf } from '@/core/schedule/time';
import { ClassRow } from '@/features/schedule/class-row';
import { useSchedule } from '@/features/schedule/schedule-provider';
import { useNow } from '@/features/schedule/use-now';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';

type View_ = 'day' | 'week';

function longDate(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const wd = WEEKDAYS[weekdayOf(date) - 1].long;
  const month = new Date(Date.UTC(y, m - 1, d)).toLocaleString('en-CA', { month: 'long', timeZone: 'UTC' });
  return `${wd}, ${month} ${d}`;
}

export default function ScheduleScreen() {
  const { state, reload } = useSchedule();
  const now = useNow();
  const theme = useTheme();
  const { wide } = useLayout();
  const [view, setView] = useState<View_>('week');
  const [date, setDate] = useState(now.date);

  const allClasses = useMemo(() => (state.status === 'ready' ? state.classes : []), [state]);
  const termOptions = useMemo(() => {
    const labels = new Set([...upcomingTerms(now.date).map((t) => t.label), ...allClasses.map((c) => c.term_label)]);
    return [...labels].map((l) => ({ value: l, label: l }));
  }, [allClasses, now.date]);
  const [term, setTerm] = useState(termOptions[0].value);

  const classes = useMemo(() => allClasses.filter((c) => c.term_label === term), [allClasses, term]);
  const conflicts = useMemo(() => findConflicts(classes), [classes]);
  const conflictIds = useMemo(() => new Set(conflicts.flat().map((c) => c.id)), [conflicts]);

  const openClass = (c: ClassEvent) => router.push({ pathname: '/class-editor', params: { id: c.id } });

  if (state.status === 'loading') {
    return (
      <Screen title="Schedule">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <Skeleton width="30%" height={18} />
            <Skeleton width="80%" />
          </Card>
        ))}
      </Screen>
    );
  }

  if (state.status === 'error') {
    return (
      <Screen title="Schedule">
        {state.missingTable ? (
          <EmptyState
            title="Database setup needed"
            message="Run supabase/migrations/20261114120000_class_events.sql in the Supabase SQL Editor, then try again."
            actionLabel="Try again"
            onAction={reload}
          />
        ) : (
          <ErrorState message={state.message} onRetry={reload} />
        )}
      </Screen>
    );
  }

  const weekStart = startOfWeek(date);
  const weekDays = WEEKDAYS.map((w, i) => ({ ...w, date: addDays(weekStart, i) })).filter(
    (d) => d.iso <= 5 || classesOn(classes, d.date).length > 0,
  );
  const dayList = classesOn(classes, date);
  const gaps = dayList.length ? freePeriods(classes, date, { minMinutes: 45 }) : [];

  return (
    <Screen title="Schedule" subtitle="All times are campus time (Montréal)." maxWidth={1100}>
      <View style={[styles.toolbar, wide && styles.toolbarWide]}>
        <View style={styles.flex}>
          <Segmented label="Term" options={termOptions} value={term} onChange={setTerm} />
        </View>
        <View style={wide ? styles.viewToggle : undefined}>
          <Segmented
            label="View"
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
            ]}
            value={view}
            onChange={setView}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.flex}>
          <Button label="Add class" onPress={() => router.push({ pathname: '/class-editor', params: { term } })} />
        </View>
        <View style={styles.flex}>
          <Button label="Import .ics" variant="secondary" onPress={() => router.push({ pathname: '/import-schedule', params: { term } })} />
        </View>
      </View>

      {conflicts.length > 0 && (
        <Card style={[styles.banner, { borderColor: theme.danger }]} accessibilityRole="alert">
          <ThemedText type="smallBold" themeColor="danger">
            {conflicts.length === 1 ? '1 schedule conflict' : `${conflicts.length} schedule conflicts`}
          </ThemedText>
          {conflicts.map(([a, b]) => (
            <ThemedText key={a.id + b.id} type="small" themeColor="textSecondary">
              {a.course_code} {a.component} overlaps {b.course_code} {b.component}
            </ThemedText>
          ))}
        </Card>
      )}

      {classes.length === 0 ? (
        <EmptyState
          title={`No classes in ${term}`}
          message="Add your classes one by one, or import the .ics calendar file exported from your student portal or calendar app."
        />
      ) : (
        <>
          <View style={styles.nav}>
            <NavButton
              label={view === 'day' ? 'Previous day' : 'Previous week'}
              icon="back"
              onPress={() => setDate(addDays(date, view === 'day' ? -1 : -7))}
            />
            <Pressable accessibilityRole="button" onPress={() => setDate(now.date)} style={styles.navCenter}>
              <ThemedText type="heading">
                {view === 'day' ? longDate(date) : `Week of ${longDate(weekStart)}`}
              </ThemedText>
              {date !== now.date ? (
                <ThemedText type="caption" themeColor="accent">
                  Back to today
                </ThemedText>
              ) : null}
            </Pressable>
            <NavButton
              label={view === 'day' ? 'Next day' : 'Next week'}
              icon="arrow"
              onPress={() => setDate(addDays(date, view === 'day' ? 1 : 7))}
            />
          </View>

          {view === 'day' ? (
            <View style={styles.list}>
              {dayList.length === 0 ? (
                <EmptyState title="No classes this day" message="Enjoy the free time." />
              ) : (
                dayList.map((o) => (
                  <ClassRow key={o.event.id} event={o.event} conflict={conflictIds.has(o.event.id)} onPress={() => openClass(o.event)} />
                ))
              )}
              {gaps.length > 0 && (
                <Card>
                  <ThemedText type="smallBold">Free periods</ThemedText>
                  {gaps.map((g) => (
                    <ThemedText key={g.start} type="small" themeColor="textSecondary">
                      {formatTime(g.start)} – {formatTime(g.end)}
                    </ThemedText>
                  ))}
                </Card>
              )}
            </View>
          ) : (
            <View style={[styles.week, wide && styles.weekWide]}>
              {weekDays.map((d) => {
                const list = classesOn(classes, d.date);
                const isToday = d.date === now.date;
                return (
                  <View key={d.date} style={[styles.dayCol, wide && styles.flex]}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${d.long}`}
                      onPress={() => {
                        setDate(d.date);
                        setView('day');
                      }}
                      style={[styles.dayHeader, isToday && { backgroundColor: theme.accent }]}>
                      <ThemedText type="smallBold" style={isToday ? { color: theme.accentText } : undefined}>
                        {wide ? d.short : d.long} {Number(d.date.slice(8))}
                      </ThemedText>
                    </Pressable>
                    {list.length === 0 ? (
                      <ThemedText type="caption" themeColor="textSecondary" style={styles.none}>
                        No classes
                      </ThemedText>
                    ) : (
                      list.map((o) => (
                        <ClassRow key={o.event.id} event={o.event} compact={wide} conflict={conflictIds.has(o.event.id)} onPress={() => openClass(o.event)} />
                      ))
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

function NavButton({ label, icon, onPress }: { label: string; icon: 'back' | 'arrow'; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.navBtn, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <Icon name={icon} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  toolbar: { gap: Spacing.two },
  toolbarWide: { flexDirection: 'row', alignItems: 'center' },
  viewToggle: { width: 200 },
  actions: { flexDirection: 'row', gap: Spacing.two },
  banner: { borderWidth: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  navCenter: { flex: 1, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: Spacing.two },
  week: { gap: Spacing.three },
  weekWide: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  dayCol: { gap: Spacing.two },
  dayHeader: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  none: { paddingHorizontal: Spacing.two },
});
