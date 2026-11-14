import { useWindowDimensions } from 'react-native';

import { Breakpoints } from '@/styles/theme';

/** Responsive helpers: `isWide` shows the sidebar layout, `isMedium` allows two-column grids. */
export function useLayout() {
  const { width } = useWindowDimensions();
  return { width, isWide: width >= Breakpoints.wide, isMedium: width >= Breakpoints.medium };
}
