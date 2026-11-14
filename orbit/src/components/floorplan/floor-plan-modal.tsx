import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Floor } from '@/constants/floorplans';
import { Spacing } from '@/constants/theme';

type Props = { floor: Floor | null; onClose: () => void };

/** Full floor plan: raster drawing with the room outlines overlaid. */
export function FloorPlanModal({ floor, onClose }: Props) {
  return (
    <Modal visible={!!floor} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Inner Pressable swallows taps so only the backdrop closes the modal. */}
        <Pressable style={styles.sheetWrap}>
          <ThemedView type="backgroundElement" style={styles.sheet}>
            <View style={styles.header}>
              <ThemedText type="subtitle">Molson Building · {floor?.label}</ThemedText>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose}>
                <ThemedText type="link">Close</ThemedText>
              </Pressable>
            </View>
            {floor && (
              <View style={styles.plan}>
                {floor.image ? (
                  <Image source={floor.image} style={StyleSheet.absoluteFill} contentFit="contain" />
                ) : (
                  <View style={[StyleSheet.absoluteFill, styles.blank]} />
                )}
                <Image
                  source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(floor.svg)}` }}
                  style={StyleSheet.absoluteFill}
                  contentFit="contain"
                />
              </View>
            )}
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  sheetWrap: { width: '100%', maxWidth: 760 },
  sheet: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.three },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plan: { width: '100%', aspectRatio: 1, borderRadius: Spacing.two, overflow: 'hidden' },
  blank: { backgroundColor: '#ffffff' },
});
