import { SymbolView } from 'expo-symbols';

import { IconSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** One icon vocabulary for the app: SF Symbols on iOS, Material Symbols on Android/web. */
const ICONS = {
  home: { ios: 'house', android: 'home', web: 'home' },
  schedule: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  map: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  friends: { ios: 'person.2', android: 'group', web: 'group' },
  live: { ios: 'dot.radiowaves.left.and.right', android: 'sensors', web: 'sensors' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  arrow: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  bolt: { ios: 'bolt', android: 'bolt', web: 'bolt' },
  import: { ios: 'square.and.arrow.down', android: 'download', web: 'download' },
  directions: { ios: 'location.north', android: 'near_me', web: 'near_me' },
  share: { ios: 'person.badge.plus', android: 'group_add', web: 'group_add' },
  cafe: { ios: 'cup.and.saucer', android: 'local_cafe', web: 'local_cafe' },
  building: { ios: 'building.2', android: 'apartment', web: 'apartment' },
  floors: { ios: 'square.stack.3d.up', android: 'layers', web: 'layers' },
  study: { ios: 'book', android: 'menu_book', web: 'menu_book' },
  sun: { ios: 'sun.max', android: 'light_mode', web: 'light_mode' },
  moon: { ios: 'moon', android: 'dark_mode', web: 'dark_mode' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
} as const;

export type IconName = keyof typeof ICONS;

type Props = { name: IconName; size?: number; color?: string };

export function Icon({ name, size = IconSize.md, color }: Props) {
  const theme = useTheme();
  return (
    <SymbolView
      name={ICONS[name] as never}
      size={size}
      tintColor={color ?? theme.text}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
