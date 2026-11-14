import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/providers/theme-preference';

/** Resolved palette for the current appearance (system, or the user's override). */
export function useTheme() {
  return Colors[useThemePreference().scheme];
}
