/**
 * ORBIT design tokens. Concordia burgundy (#912338) + gold (#CBB576) on navy and warm paper surfaces,
 * muted blue-greys, semantic green/amber/red. Every colour, size and duration lives here.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1F1A1C',
    textSecondary: '#5E5A58',
    background: '#F6F2EC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#ECE6DD',
    border: '#E6DFD4',
    accent: '#912338',
    accentText: '#FFFFFF',
    accentLink: '#912338',
    accentSoft: 'rgba(145, 35, 56, 0.45)',
    accentTint: 'rgba(145, 35, 56, 0.08)',
    gold: '#CBB576',
    onGold: '#14172A',
    success: '#1E7A45',
    warning: '#8F5A00',
    danger: '#B3261E',
  },
  dark: {
    text: '#F2F4F8',
    textSecondary: '#A9B0C6',
    background: '#0E111C',
    backgroundElement: '#181C2B',
    backgroundSelected: '#222740',
    border: '#2B3150',
    accent: '#C0476A',
    accentText: '#FFFFFF',
    // Burgundy #912338 fails AA as text on navy, so dark mode lifts the link tint.
    accentLink: '#E0708D',
    accentSoft: 'rgba(192, 71, 106, 0.45)',
    accentTint: 'rgba(224, 112, 141, 0.14)',
    gold: '#CBB576',
    onGold: '#14172A',
    success: '#4CC38A',
    warning: '#E8B04A',
    danger: '#FF7A70',
  },
} as const;

/** Theme-independent colours (drawn on fixed surfaces such as floor-plan SVGs and photos). */
export const FixedColors = {
  white: '#FFFFFF',
  black: '#000000',
  planSurface: '#FFFFFF',
  roomHighlight: '#D32F2F',
  /** App shell (sidebar) stays navy in both themes. */
  shell: '#0F1320',
  shellText: '#F2F4F8',
  shellMuted: '#A6ADC2',
  shellBorder: '#232842',
  shellHover: '#1A1F33',
  shellActive: '#912338',
  shellRaised: '#151A2E',
  successOnShell: '#4CC38A',
  warningOnShell: '#E8B04A',
  dangerOnShell: '#FF7A70',
  gold: '#CBB576',
  /** Hero photo scrim: navy, heavier on the left where the greeting sits. */
  heroScrimStart: 'rgba(15, 19, 32, 0.88)',
  heroScrimEnd: 'rgba(15, 19, 32, 0.25)',
  heroGlass: 'rgba(15, 19, 32, 0.72)',
  heroGlassBorder: 'rgba(255, 255, 255, 0.16)',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Manrope weights, loaded in the root layout (see `ManropeFonts`). */
export const FontFamily = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

export const Fonts = Platform.select({
  ios: { sans: FontFamily.regular, serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: FontFamily.regular, serif: 'serif', rounded: FontFamily.regular, mono: 'monospace' },
  web: {
    sans: `${FontFamily.regular}, var(--font-display)`,
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Type scale. Spread into a text style: `{ ...Typography.heading }`. Weight lives in the family. */
export const Typography = {
  display: { fontFamily: FontFamily.extrabold, fontSize: 44, lineHeight: 50, letterSpacing: -1 },
  displaySmall: { fontFamily: FontFamily.extrabold, fontSize: 30, lineHeight: 36, letterSpacing: -0.5 },
  title: { fontFamily: FontFamily.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  subtitle: { fontFamily: FontFamily.semibold, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20 },
  smallBold: { fontFamily: FontFamily.bold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: FontFamily.medium, fontSize: 12, lineHeight: 16 },
  link: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20 },
  stat: { fontFamily: FontFamily.extrabold, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
} as const;

/** Minimum touch target (pt). */
export const TouchTarget = 44;

export const IconSize = { sm: 16, md: 20, lg: 24, xl: 32 } as const;

/** Animation timing in ms. */
export const Motion = { fast: 120, base: 200, slow: 320 } as const;

/** Elevation levels; shadows are intentionally subtle. */
export const Elevation = {
  none: {},
  card: Platform.select({
    web: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    default: {
      shadowColor: FixedColors.black,
      shadowOpacity: 0.08,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
  }) as object,
  raised: Platform.select({
    web: { boxShadow: '0 6px 18px rgba(0,0,0,0.12)' },
    default: {
      shadowColor: FixedColors.black,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
  }) as object,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1200;

/** Responsive breakpoints (px). `wide` switches bottom tabs to the sidebar. */
export const Breakpoints = { medium: 720, wide: 1024 } as const;

export const SidebarWidth = 248;
export const HeroHeight = { compact: 260, wide: 340 } as const;
export const AvatarSize = { sm: 32, md: 44, lg: 56, xl: 96 } as const;
export const DotSize = 10;
export const BadgeSize = 10;

/** Interaction-state opacities. */
export const Opacity = { hover: 0.92, pressed: 0.75, disabled: 0.5 } as const;

/** Height of the web bottom tab bar on narrow screens. */
export const TabBarHeight = 64;

/** Max width of the Molson building photo viewer (portrait photo). */
export const BuildingViewerMaxWidth = 480;

export const AuthFormWidth = 440;

/** Fixed component dimensions that are not part of the spacing scale. */
export const Size = {
  cardMin: 200,
  searchMax: 320,
  copyMax: 520,
  mapPreview: 168,
  sectionHeader: 32,
  roomPanel: 300,
  chipMin: 88,
  rosterName: 220,
  dropdownMax: 420,
  searchOpen: 560,
  pasteHeight: 140,
  hourHeight: 56,
  stageViewer: 260,
  stageInfoMin: 240,
} as const;

/** Max width of forms and sheets, so inputs never stretch across a desktop screen. */
export const FormWidth = 640;
