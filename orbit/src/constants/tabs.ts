import type { IconName } from '@/components/ui/icon';

/** Single source of truth for the primary navigation (PLAN.md §2–3). Max 5 (Android limit). */
export const TABS = [
  { name: 'index', href: '/', label: 'Home', icon: 'home', sf: { default: 'house', selected: 'house.fill' }, md: 'home' },
  { name: 'schedule', href: '/schedule', label: 'Schedule', icon: 'schedule', sf: { default: 'calendar', selected: 'calendar' }, md: 'calendar_month' },
  { name: 'navigator', href: '/navigator', label: 'Map', icon: 'map', sf: { default: 'map', selected: 'map.fill' }, md: 'map' },
  { name: 'friends', href: '/friends', label: 'Friends', icon: 'friends', sf: { default: 'person.2', selected: 'person.2.fill' }, md: 'group' },
  { name: 'live', href: '/live', label: 'Campus Live', icon: 'live', sf: { default: 'dot.radiowaves.left.and.right', selected: 'dot.radiowaves.left.and.right' }, md: 'sensors' },
] as const satisfies readonly ({ icon: IconName } & Record<string, unknown>)[];
