import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './sheet.styles';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** Primary action in the header (e.g. "Save"). */
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

/** Full-height modal sheet with a Cancel / title / action header. */
export function Sheet({ visible, title, onClose, actionLabel, onAction, actionDisabled, children, footer }: Props) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={onClose}>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8} style={styles.side}>
              <ThemedText type="link" themeColor="textSecondary">
                Cancel
              </ThemedText>
            </Pressable>
            <ThemedText type="heading" numberOfLines={1} style={styles.title} accessibilityRole="header">
              {title}
            </ThemedText>
            <View style={[styles.side, styles.right]}>
              {actionLabel && onAction ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !!actionDisabled }}
                  disabled={actionDisabled}
                  onPress={onAction}
                  hitSlop={8}>
                  <ThemedText type="link" style={actionDisabled ? styles.disabled : undefined}>
                    {actionLabel}
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.content}>{children}</View>
          </ScrollView>
          {footer ? <View style={[styles.footer, { borderTopColor: theme.border }]}>{footer}</View> : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
