import { useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Opacity, Spacing, TouchTarget } from '@/constants/theme';
import {
  DAY_NAMES,
  formatClock,
  parseTime,
  useSchedule,
  WEEK_ORDER,
  type ClassEntry,
} from '@/features/schedule/use-schedule';
import { useLayout } from '@/hooks/use-layout';

const DAY_OPTIONS = WEEK_ORDER.map((d) => ({ value: d, label: DAY_NAMES[d].slice(0, 3) }));

function shareText(entries: ClassEntry[]) {
  return WEEK_ORDER.flatMap((d) =>
    entries
      .filter((e) => e.day === d)
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((e) => `${DAY_NAMES[d].slice(0, 3)} ${formatClock(e.start)}–${formatClock(e.end)}  ${e.code} ${e.title}${e.room ? ` (${e.room})` : ''}`),
  ).join('\n');
}

export default function ScheduleScreen() {
  const { entries, ready, add, remove } = useSchedule();
  const { isWide } = useLayout();
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [day, setDay] = useState<number | undefined>(1);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const s = parseTime(start);
    const e = parseTime(end);
    if (!code.trim()) return setError('Enter the course code, for example COMP 352.');
    if (day === undefined) return setError('Pick the day of the week.');
    if (!s || !e) return setError('Enter times as 24 h HH:MM, for example 13:15.');
    if (e.h * 60 + e.m <= s.h * 60 + s.m) return setError('The class has to end after it starts.');
    add({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      room: room.trim().toUpperCase(),
      day,
      start: `${String(s.h).padStart(2, '0')}:${String(s.m).padStart(2, '0')}`,
      end: `${String(e.h).padStart(2, '0')}:${String(e.m).padStart(2, '0')}`,
    });
    setError(null);
    setCode('');
    setTitle('');
    setRoom('');
    setStart('');
    setEnd('');
  }

  const form = (
    <Card style={styles.grow}>
      <CardHeader icon="add" title="Add a class" />
      <TextField label="Course code" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="COMP 352" />
      <TextField label="Course name (optional)" value={title} onChangeText={setTitle} placeholder="Data Structures and Algorithms" />
      <TextField label="Room (optional)" value={room} onChangeText={setRoom} autoCapitalize="characters" placeholder="H-820" />
      <ChoiceChips label="Day" options={DAY_OPTIONS} value={day} onChange={setDay} />
      <View style={styles.times}>
        <View style={styles.grow}>
          <TextField label="Starts (24 h)" value={start} onChangeText={setStart} placeholder="13:15" keyboardType="numbers-and-punctuation" />
        </View>
        <View style={styles.grow}>
          <TextField label="Ends (24 h)" value={end} onChangeText={setEnd} placeholder="14:30" keyboardType="numbers-and-punctuation" onSubmitEditing={submit} />
        </View>
      </View>
      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}
      <Button label="Save class" icon="check" onPress={submit} />
    </Card>
  );

  const week = (
    <View style={[styles.grow, styles.week]}>
      {ready && entries.length === 0 ? (
        <EmptyState
          title="No classes yet"
          message="Add your first class and it shows up here and on your home screen with a live countdown."
        />
      ) : (
        WEEK_ORDER.map((d) => {
          const list = entries.filter((e) => e.day === d).sort((a, b) => a.start.localeCompare(b.start));
          if (!list.length) return null;
          return (
            <Card key={d}>
              <ThemedText type="heading" accessibilityRole="header">
                {DAY_NAMES[d]}
              </ThemedText>
              {list.map((e) => (
                <View key={e.id} style={styles.entry}>
                  <View style={styles.entryText}>
                    <ThemedText type="smallBold">
                      {e.code}
                      {e.title ? ` · ${e.title}` : ''}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatClock(e.start)} – {formatClock(e.end)}
                      {e.room ? ` · ${e.room}` : ''}
                    </ThemedText>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${e.code} on ${DAY_NAMES[d]}`}
                    onPress={() => remove(e.id)}
                    style={({ pressed }) => [styles.remove, pressed && { opacity: Opacity.pressed }]}>
                    <Icon name="delete" size="lg" color="textSecondary" />
                  </Pressable>
                </View>
              ))}
            </Card>
          );
        })
      )}
      {entries.length > 0 && (
        <Button
          label="Share schedule"
          variant="secondary"
          icon="ios-share"
          onPress={() => Share.share({ message: shareText(entries) })}
        />
      )}
    </View>
  );

  return (
    <Screen title="Schedule" subtitle="Your week, saved on this device">
      <View style={[styles.layout, isWide && styles.layoutWide]}>
        {form}
        {week}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  layout: { gap: Spacing.four },
  layoutWide: { flexDirection: 'row', alignItems: 'flex-start' },
  grow: { flex: 1 },
  week: { gap: Spacing.three },
  times: { flexDirection: 'row', gap: Spacing.three },
  entry: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three, minHeight: TouchTarget },
  entryText: { flexShrink: 1, gap: Spacing.half },
  remove: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
});
