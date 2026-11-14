import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { ThemedText } from '@/components/ui/themed-text';
import { WAIT_MINUTES } from '@/data/constants';
import type { LiveLevel } from '@/data/enums';
import { CONFIDENCE_LABEL, LIVE_LEVEL_LABEL, LIVE_LEVEL_SHORT, LIVE_LEVEL_TONE } from '@/data/labels';
import type { LiveLocation } from '@/data/types';
import { estimateFor, submitReport } from '@/features/live/store';
import { trendFor } from '@/features/live/trend';
import { useTheme } from '@/hooks/use-theme';
import { Opacity, type ThemeColor } from '@/styles/theme';

import { styles } from './location-card.styles';

/** Four-step meter: filled segments = how busy (0 = empty/quiet … 3 = full). */
function Meter({ level }: { level: LiveLevel | null }) {
  const theme = useTheme();
  return (
    <View style={styles.meter} accessibilityElementsHidden importantForAccessibility="no">
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.seg, { backgroundColor: level !== null && i <= level ? theme[LIVE_LEVEL_TONE[level]] : theme.backgroundSelected }]} />
      ))}
    </View>
  );
}

type Props = {
  location: LiveLocation;
  now: Date;
  /** Minutes on foot from where the student is (or will be), when known. */
  walk?: number | null;
  highlighted?: boolean;
  best?: boolean;
};

/** One place: precise estimate, who/when/how sure, trend, walking time and a quick report. */
export function LocationCard({ location, now, walk, highlighted, best }: Props) {
  const theme = useTheme();
  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: ThemeColor } | null>(null);
  const estimate = estimateFor(location, now);
  const trend = trendFor(location.reports, now);
  const food = location.category === 'food';
  const level = estimate.level;

  async function report(l: LiveLevel) {
    setBusy(true);
    setMessage(null);
    try {
      await submitReport(location.id, l);
      setReporting(false);
      setMessage({ text: 'Thanks! Your report is live for 45 minutes.', tone: 'success' });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Could not send your report.', tone: 'danger' });
    }
    setBusy(false);
  }

  return (
    <Card style={[styles.card, highlighted && { borderColor: theme.gold, borderWidth: 2 }]}>
      <View style={styles.head}>
        <View style={[styles.iconTile, { backgroundColor: theme.accentTint }]}>
          <Icon name={food ? 'restaurant' : 'chair'} size="lg" color="accentLink" />
        </View>
        <View style={styles.flex}>
          <ThemedText type="heading" numberOfLines={1}>
            {location.name}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {[location.buildingCode, location.detail].filter(Boolean).join(' · ')}
            {walk != null ? ` · ${walk} min walk` : ''}
          </ThemedText>
        </View>
        {best ? <Pill label="Best now" tone="gold" /> : null}
      </View>

      <View style={styles.reading}>
        <View style={styles.flex}>
          <ThemedText type="subtitle" themeColor={level === null ? 'textSecondary' : LIVE_LEVEL_TONE[level]} accessibilityLiveRegion="polite">
            {level === null ? 'No recent reports' : food ? LIVE_LEVEL_SHORT.food[level] : LIVE_LEVEL_LABEL.study[level]}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {level === null
              ? 'Be the first to tell others what it is like.'
              : food
                ? level === 0
                  ? 'No line at the moment'
                  : `About ${WAIT_MINUTES[level]} min wait`
                : `${estimate.contributors} ${estimate.contributors === 1 ? 'student says' : 'students say'} so`}
          </ThemedText>
        </View>
        <Meter level={level} />
      </View>

      {level !== null && (
        <View style={styles.facts}>
          <Pill label={CONFIDENCE_LABEL[estimate.confidence]} tone={estimate.confidence === 'high' ? 'gold' : 'neutral'} />
          <Pill label={`${estimate.contributors} ${estimate.contributors === 1 ? 'student' : 'students'}`} />
          <Pill label={estimate.newestMinutes === 0 ? 'Just now' : `${estimate.newestMinutes} min ago`} />
          {trend ? <Pill label={trend === 'busier' ? 'Getting busier' : trend === 'quieter' ? 'Getting quieter' : 'Steady'} tone={trend === 'busier' ? 'accent' : 'neutral'} /> : null}
        </View>
      )}

      {message ? (
        <ThemedText type="small" themeColor={message.tone} accessibilityLiveRegion="polite">
          {message.text}
        </ThemedText>
      ) : null}

      {reporting ? (
        <View style={styles.report}>
          <ThemedText type="smallBold">{food ? 'How long is the line right now?' : 'How many seats are free right now?'}</ThemedText>
          <View style={styles.choices}>
            {([0, 1, 2, 3] as LiveLevel[]).map((l) => (
              <Pressable
                key={l}
                accessibilityRole="button"
                accessibilityLabel={LIVE_LEVEL_LABEL[location.category][l]}
                disabled={busy}
                onPress={() => report(l)}
                style={({ pressed }) => [styles.choice, { backgroundColor: theme.backgroundSelected, borderColor: theme[LIVE_LEVEL_TONE[l]] }, (pressed || busy) && { opacity: Opacity.pressed }]}>
                <View style={[styles.choiceDot, { backgroundColor: theme[LIVE_LEVEL_TONE[l]] }]} />
                <ThemedText type="smallBold">{LIVE_LEVEL_SHORT[location.category][l]}</ThemedText>
              </Pressable>
            ))}
          </View>
          <Button label="Cancel" variant="ghost" onPress={() => setReporting(false)} disabled={busy} />
        </View>
      ) : (
        <Button
          label={food ? 'Report the line' : 'Report seating'}
          variant="secondary"
          icon="campaign"
          onPress={() => {
            setMessage(null);
            setReporting(true);
          }}
        />
      )}
    </Card>
  );
}
