/** Single source of truth for the primary navigation (PLAN.md §2–3). */
export const TABS = [
  { name: 'index', href: '/', label: 'Home', sf: { default: 'house', selected: 'house.fill' }, md: 'home' },
  { name: 'schedule', href: '/schedule', label: 'Schedule', sf: { default: 'calendar', selected: 'calendar' }, md: 'calendar_month' },
  { name: 'navigator', href: '/navigator', label: 'Navigator', sf: { default: 'map', selected: 'map.fill' }, md: 'map' },
  { name: 'friends', href: '/friends', label: 'Friends', sf: { default: 'person.2', selected: 'person.2.fill' }, md: 'group' },
  { name: 'live', href: '/live', label: 'Live', sf: { default: 'dot.radiowaves.left.and.right', selected: 'dot.radiowaves.left.and.right' }, md: 'sensors' },
] as const;
