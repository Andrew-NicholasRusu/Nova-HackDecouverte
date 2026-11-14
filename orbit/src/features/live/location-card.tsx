import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import type { ThemeColor } from '@/constants/theme';

import type { LiveEstimate, LiveLevel } from './confidence';
import { estimateFor, LEVEL_LABEL, LEVEL_SHORT, submitReport, type LiveLocation } from './store';

const LEVEL_COLOR: Record<LiveLevel, ThemeColor> = { 0: 'success', 1: 'success', 2: 'warning', 3: 'danger' };

export function describeEstimate(e: LiveEstimate): string {
  if (e.level === null) return 'No recent reports';
  const age = e.newestMinutes === 0 ? 'just now' : `${e.newestMinutes} min ago`;
  const who = e.contributors === 1 ? '1 student' : `${e.contributors} students`;
  return `${who} · latest ${age} · ${e.confidence} confidence`;
}

/** One place: current community estimate, its freshness/confidence, and a quick report action. */
export function LocationCard({ location, now }: { location: LiveLocation; now: Date }) {
  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: ThemeColor } | null>(null);
  const estimate = estimateFor(location, now);

  async function report(level: LiveLevel) {
    setBusy(true);
    setMessage(null);
    try {
      await submitReport(location.id, level);
      setReporting(false);
      setMessage({ text: 'Thanks! Your report is live for 45 minutes.', tone: 'success' });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Could not send your report.', tone: 'danger' });
    }
    setBusy(false);
  }

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.flex}>
          <ThemedText type="heading" numberOfLines={1}>
            {location.name}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {[location.buildingCode, location.detail].filter(Boolean).join(' · ')}
          </ThemedText>
        </View>
      </View>

      <ThemedText type="default" themeColor={estimate.level === null ? 'textSecondary' : LEVEL_COLOR[estimate.level]}>
        {estimate.level === null ? 'Unknown right now' : LEVEL_LABEL[location.category][estimate.level]}
      </ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {describeEstimate(estimate)}
      </ThemedText>

      {message ? (
        <ThemedText type="small" themeColor={message.tone}>
          {message.text}
        </ThemedText>
      ) : null}

      {reporting ? (
        <View style={styles.report}>
          <ThemedText type="smallBold">{location.category === 'food' ? 'How long is the line?' : 'How many seats are free?'}</ThemedText>
          <View style={styles.chips}>
            {([0, 1, 2, 3] as LiveLevel[]).map((level) => (
              <Chip
                key={level}
                label={LEVEL_SHORT[location.category][level]}
                accessibilityLabel={LEVEL_LABEL[location.category][level]}
                onPress={() => !busy && report(level)}
              />
            ))}
          </View>
          <Button label="Cancel" variant="secondary" onPress={() => setReporting(false)} disabled={busy} />
        </View>
      ) : (
        <Button
          label={location.category === 'food' ? 'Report the line' : 'Report seating'}
          variant="secondary"
          onPress={() => {
            setMessage(null);
            setReporting(true);
          }}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  report: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
