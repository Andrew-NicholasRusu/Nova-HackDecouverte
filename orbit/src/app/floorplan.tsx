import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BuildingViewer } from '@/components/floorplan/building-viewer';
import { FloorPlanModal } from '@/components/floorplan/floor-plan-modal';
import { FloorSwitcher } from '@/components/floorplan/floor-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Floor } from '@/constants/floorplans';
import { BottomTabInset, Spacing } from '@/constants/theme';

export default function FloorplanScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Floor | null>(null);

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.six, paddingBottom: BottomTabInset + Spacing.five },
        ]}
      >
        <ThemedText type="subtitle">Molson Building</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.hint}>
          Hover a floor to highlight it, then click to open its plan. Or pick one below.
        </ThemedText>
        <BuildingViewer onSelect={setSelected} />
        <FloorSwitcher onSelect={setSelected} />
      </ScrollView>
      <FloorPlanModal floor={selected} onSelect={setSelected} onClose={() => setSelected(null)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three },
  hint: { textAlign: 'center' },
});
