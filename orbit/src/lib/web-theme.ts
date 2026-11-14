import { Platform } from 'react-native';

import { Colors } from '@/styles/theme';

const STYLE_ID = 'orbit-web-theme';

/**
 * Web-only: themes the browser surfaces no component draws (text selection, scrollbars, focus rings,
 * numerals) from the same tokens as the rest of the app.
 */
let guardsInstalled = false;

/** Blocks dragging and copying page content (inputs stay normal). */
function installGuards() {
  if (guardsInstalled) return;
  guardsInstalled = true;
  const editable = (t: EventTarget | null) => /INPUT|TEXTAREA/.test((t as HTMLElement | null)?.tagName ?? '');
  document.addEventListener('dragstart', (e) => e.preventDefault());
  document.addEventListener('selectstart', (e) => !editable(e.target) && e.preventDefault());
  for (const type of ['copy', 'cut'] as const) {
    document.addEventListener(type, (e) => !editable(e.target) && e.preventDefault());
  }
}

export function applyWebTheme(scheme: 'light' | 'dark') {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  installGuards();
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
    /* The app is not a document: nothing is selectable or draggable, except what you type into. */
    html, body, div, span, a, button, img, svg { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    input, textarea { -webkit-user-select: text; user-select: text; }
    img, svg, a { -webkit-user-drag: none; user-drag: none; }
    body { font-variant-numeric: tabular-nums; text-rendering: optimizeLegibility; }
  `;
}
