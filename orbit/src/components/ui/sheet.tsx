import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * One modal per screen; swap the <Sheet> rendered inside it instead of
 * opening a second modal (stacked/sibling modals are unreliable on iOS).
 */
export function SheetHost({ children, onClose }: { children: ReactNode | null; onClose: () => void }) {
  return (
    <Modal
      visible={children !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      {children}
    </Modal>
  );
}

type SheetProps = {
  title: string;
  onClose: () => void;
  closeLabel?: string;
  /** Pinned below the scrolling content (e.g. the primary action). */
  footer?: ReactNode;
  children: ReactNode;
};

/** Full-height sheet layout used for forms and review flows. */
export function Sheet({ title, onClose, closeLabel = 'Cancel', footer, children }: SheetProps) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderColor: theme.border }]}>
          <ThemedText type="heading" accessibilityRole="header" style={styles.title} numberOfLines={1}>
            {title}
          </ThemedText>
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={12}>
            <ThemedText type="link">{closeLabel}</ThemedText>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>{children}</View>
        </ScrollView>
        {footer ? (
          <View style={[styles.footer, { borderColor: theme.border }]}>
            <View style={styles.content}>{footer}</View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { flex: 1 },
  scroll: { alignItems: 'center', padding: Spacing.three, paddingBottom: Spacing.five },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three, alignSelf: 'center' },
  footer: { padding: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth },
});
