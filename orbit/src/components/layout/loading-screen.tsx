import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { styles } from './loading-screen.styles';

/** Full-screen spinner while the session, fonts or profile load. */
export function LoadingScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );
}
