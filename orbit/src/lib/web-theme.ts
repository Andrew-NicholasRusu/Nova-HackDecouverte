import { Platform } from 'react-native';

import { Colors } from '@/constants/theme';

const STYLE_ID = 'orbit-web-theme';

/**
 * Web-only: themes the browser surfaces no component draws (text selection, scrollbars, focus rings,
 * numerals) from the same tokens as the rest of the app.
 */
export function applyWebTheme(scheme: 'light' | 'dark') {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const c = Colors[scheme];
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `
    :root { color-scheme: ${scheme}; accent-color: ${c.accent}; }
    ::selection { background: ${c.accent}; color: ${c.accentText}; }
    * { scrollbar-width: thin; scrollbar-color: ${c.border} transparent; }
    :focus-visible { outline: 2px solid ${c.accentLink}; outline-offset: 2px; border-radius: 4px; }
    input:focus-visible, textarea:focus-visible { outline: none; }
    body { font-variant-numeric: tabular-nums; text-rendering: optimizeLegibility; }
  `;
}
