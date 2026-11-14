import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AvatarSize, DotSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  name: string;
  /** Profile picture URL; initials show while it loads or if it fails. */
  uri?: string | null;
  size?: keyof typeof AvatarSize | 'xl';
  /** Presence dot: green when free, hidden when undefined. */
  presence?: 'free' | 'busy';
  /** Use on the navy hero/sidebar, where the avatar needs a light ring. */
  onDark?: boolean;
};

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

export function Avatar({ name, uri, size = 'md', presence, onDark }: Props) {
  const theme = useTheme();
  const [failed, setFailed] = useState<string | null>(null);
  const px = size === 'xl' ? AvatarSize.xl : AvatarSize[size];
  const showImage = !!uri && failed !== uri;
  return (
    <View
      accessible
      accessibilityLabel={presence ? `${name}, ${presence === 'free' ? 'free now' : 'busy'}` : name}
      style={[styles.base, { width: px, height: px, borderRadius: px / 2, backgroundColor: onDark ? theme.gold : theme.accentTint }]}>
      <ThemedText
        type={size === 'sm' ? 'caption' : size === 'xl' ? 'displaySmall' : 'smallBold'}
        style={{ color: onDark ? theme.onGold : theme.accentLink }}>
        {initials(name)}
      </ThemedText>
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={[StyleSheet.absoluteFill, { borderRadius: px / 2 }]}
          contentFit="cover"
          transition={200}
          onError={() => setFailed(uri!)}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      {presence ? (
        <View
          style={[
            styles.dot,
            { backgroundColor: presence === 'free' ? theme.success : theme.textSecondary, borderColor: theme.backgroundElement },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    right: -Spacing.half,
    bottom: -Spacing.half,
    width: DotSize + Spacing.one,
    height: DotSize + Spacing.one,
    borderRadius: DotSize,
    borderWidth: 2,
  },
});
