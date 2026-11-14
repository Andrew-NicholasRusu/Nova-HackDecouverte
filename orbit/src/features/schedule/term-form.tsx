import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/text-field';
import { daysBetween, isValidDate } from '@/lib/schedule/time';
import type { Schedule } from '@/lib/schedule/types';

import { suggestTerm } from './defaults';
import { useSchedule } from './schedule-provider';

type Props = {
  /** Edit this term; null to create a new one. */
  schedule: Schedule | null;
  onClose: () => void;
};

export function TermForm({ schedule, onClose }: Props) {
  const { createSchedule, updateSchedule, deleteSchedule, schedules } = useSchedule();
  const initial = schedule ?? suggestTerm();
  const [name, setName] = useState(initial.name);
  const [startsOn, setStartsOn] = useState(initial.startsOn);
  const [endsOn, setEndsOn] = useState(initial.endsOn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const input = { name: name.trim(), startsOn: startsOn.trim(), endsOn: endsOn.trim() };
    if (!input.name) return setError('Give the term a name, e.g. "Fall 2026".');
    if (input.name.length > 60) return setError('Term name is too long.');
    if (!isValidDate(input.startsOn) || !isValidDate(input.endsOn)) {
      return setError('Use dates in YYYY-MM-DD format.');
    }
    if (input.endsOn < input.startsOn) return setError('The term must end after it starts.');
    if (daysBetween(input.startsOn, input.endsOn) > 366) return setError('A term can be at most a year long.');

    setBusy(true);
    setError(null);
    try {
      if (schedule) await updateSchedule(schedule.id, input);
      else await createSchedule(input);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!schedule) return;
    const run = async () => {
      setBusy(true);
      try {
        await deleteSchedule(schedule.id);
        onClose();
      } catch (e) {
        setError((e as Error).message);
        setBusy(false);
      }
    };
    const message = `Delete "${schedule.name}" and all of its classes? This cannot be undone.`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) void run();
    } else {
      Alert.alert('Delete term', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void run() },
      ]);
    }
  }

  return (
    <Sheet
      title={schedule ? 'Edit term' : 'New term'}
      onClose={onClose}
      footer={<Button label={busy ? 'Saving…' : 'Save term'} onPress={save} disabled={busy} />}>
      <ThemedText type="small" themeColor="textSecondary">
        {schedules.length === 0
          ? 'Your classes are organized by term. Start by creating the term you are in now.'
          : 'Each term keeps its own classes. You can switch between terms on the Schedule tab.'}
      </ThemedText>
      <TextField label="Term name" value={name} onChangeText={setName} placeholder="Fall 2026" maxLength={60} />
      <TextField
        label="First day of classes (YYYY-MM-DD)"
        value={startsOn}
        onChangeText={setStartsOn}
        autoCapitalize="none"
        inputMode="numeric"
        placeholder="2026-09-01"
      />
      <TextField
        label="Last day of classes (YYYY-MM-DD)"
        value={endsOn}
        onChangeText={setEndsOn}
        autoCapitalize="none"
        inputMode="numeric"
        placeholder="2026-12-23"
      />
      {!schedule ? (
        <ThemedText type="caption" themeColor="textSecondary">
          These dates are a suggestion. Check them against your official academic calendar.
        </ThemedText>
      ) : null}
      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}
      {schedule ? (
        <Button label="Delete term" variant="secondary" onPress={confirmDelete} disabled={busy} />
      ) : null}
    </Sheet>
  );
}
