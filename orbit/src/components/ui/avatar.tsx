import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function initials(name: string | null | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function Avatar({ name, size = 40 }: { name: string | null | undefined; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.root,
        { width: size, height: size, backgroundColor: theme.accent, borderRadius: Radius.pill },
      ]}>
      <ThemedText type="smallBold" style={{ color: theme.accentText, fontSize: size * 0.38 }}>
        {initials(name)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
});
