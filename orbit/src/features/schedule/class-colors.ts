/** Course colours (PLAN.md: course-specific colours). Names are stored; hex resolves per theme. */
export const CLASS_COLORS = {
  accent: { label: 'Burgundy', light: '#8A1F3D', dark: '#C0476A' },
  blue: { label: 'Blue', light: '#2F5DA8', dark: '#6C95DB' },
  green: { label: 'Green', light: '#2E7D4F', dark: '#4CAF7A' },
  amber: { label: 'Amber', light: '#A86512', dark: '#E0A53A' },
  purple: { label: 'Purple', light: '#6B4AA8', dark: '#A68BE0' },
  teal: { label: 'Teal', light: '#1F7A7A', dark: '#4DB8B8' },
} as const;

export type ClassColor = keyof typeof CLASS_COLORS;

export function classColor(name: string, scheme: 'light' | 'dark'): string {
  const c = CLASS_COLORS[name as ClassColor] ?? CLASS_COLORS.accent;
  return c[scheme];
}
