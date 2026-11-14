import { Platform, useWindowDimensions } from 'react-native';

/** Wide web screens get the sidebar shell; everything else uses the compact layout. */
export const SIDEBAR_BREAKPOINT = 1024;
export const SIDEBAR_WIDTH = 220;

export function useLayout() {
  const { width } = useWindowDimensions();
  const sidebar = Platform.OS === 'web' && width >= SIDEBAR_BREAKPOINT;
  return { width, sidebar, wide: width >= 900 };
}
