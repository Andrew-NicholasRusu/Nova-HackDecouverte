/**
 * ORBIT design tokens (PLAN.md §4). Charcoal + warm off-white surfaces,
 * restrained burgundy accent, muted greys, semantic green/amber/red.
 * Starting directions, not locked colours.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1B1B1D',
    textSecondary: '#6B6B70',
    background: '#F7F4EF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#ECE7DF',
    border: '#E3DED5',
    accent: '#8A1F3D',
    accentText: '#FFFFFF',
    success: '#2E7D4F',
    warning: '#B7791F',
    danger: '#C0392B',
  },
  dark: {
    text: '#F2EFEA',
    textSecondary: '#A0A0A6',
    background: '#141416',
    backgroundElement: '#1E1E21',
    backgroundSelected: '#2A2A2E',
    border: '#2E2E33',
    accent: '#C0476A',
    accentText: '#FFFFFF',
    success: '#4CAF7A',
    warning: '#E0A53A',
    danger: '#E5645A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
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

export const IconSize = { sm: 16, md: 20, lg: 24, xl: 32 } as const;

/** Animation timing in ms. */
export const Motion = { fast: 120, base: 200, slow: 320 } as const;

/** Elevation levels; shadows are intentionally subtle. */
export const Elevation = {
  none: {},
  card: Platform.select({
    web: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    default: {
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
  }) as object,
  raised: Platform.select({
    web: { boxShadow: '0 6px 18px rgba(0,0,0,0.12)' },
    default: {
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
  }) as object,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
