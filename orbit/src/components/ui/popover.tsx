import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** Draws the button that opens the popover. */
  renderTrigger: (open: () => void, expanded: boolean) => ReactNode;
  /** Panel content; call `close` after an action. */
  children: (close: () => void) => ReactNode;
  width?: number;
  onClose?: () => void;
};

/**
 * Menu that opens under its trigger in a transparent modal, so it always sits above the page,
 * scrolls on its own, and closes on an outside tap or Escape. Works on web and native.
 */
export function Popover({ renderTrigger, children, width = 320, onClose }: Props) {
  const theme = useTheme();
  const win = useWindowDimensions();
  const anchor = useRef<ComponentRef<typeof View>>(null);
  const [wantOpen, setWantOpen] = useState(false);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Measure after the tap, so the panel lands under the trigger wherever it is on screen.
  useEffect(() => {
    if (wantOpen) anchor.current?.measureInWindow((x, y, w, h) => setRect({ x, y, w, h }));
  }, [wantOpen]);

  const open = () => setWantOpen(true);
  const close = () => {
    setWantOpen(false);
    setRect(null);
    onClose?.();
  };

  const top = rect ? rect.y + rect.h + Spacing.two : 0;
  const right = rect ? Math.max(Spacing.two, win.width - (rect.x + rect.w)) : 0;

  return (
    <>
      <View ref={anchor} collapsable={false}>
        {renderTrigger(open, !!rect)}
      </View>
      <Modal visible={!!rect} transparent animationType="fade" onRequestClose={close}>
        <Pressable accessibilityLabel="Close menu" style={StyleSheet.absoluteFill} onPress={close} />
        {rect ? (
          <View
            accessibilityViewIsModal
            style={[
              styles.panel,
              { top, right, width: Math.min(width, win.width - Spacing.four), maxHeight: win.height - top - Spacing.three, backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={Platform.OS === 'web'}>
              {children(close)}
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', ...Elevation.raised },
});
