/** Single source of truth for primary navigation. `bar: false` keeps a route out of the mobile tab bar. */
export const TABS = [
  { name: 'index', href: '/', label: 'Home', barLabel: 'Home', icon: 'home', sf: { default: 'house', selected: 'house.fill' }, md: 'home', bar: true },
  { name: 'schedule', href: '/schedule', label: 'Schedule', barLabel: 'Schedule', icon: 'calendar-month', sf: { default: 'calendar', selected: 'calendar' }, md: 'calendar_month', bar: true },
  { name: 'navigator', href: '/navigator', label: 'Map', barLabel: 'Map', icon: 'map', sf: { default: 'map', selected: 'map.fill' }, md: 'map', bar: true },
  { name: 'friends', href: '/friends', label: 'Friends', barLabel: 'Friends', icon: 'group', sf: { default: 'person.2', selected: 'person.2.fill' }, md: 'group', bar: true },
  { name: 'live', href: '/live', label: 'Campus Live', barLabel: 'Live', icon: 'sensors', sf: { default: 'dot.radiowaves.left.and.right', selected: 'dot.radiowaves.left.and.right' }, md: 'sensors', bar: true },
  { name: 'settings', href: '/settings', label: 'Settings', barLabel: 'Settings', icon: 'settings', sf: { default: 'gearshape', selected: 'gearshape.fill' }, md: 'settings', bar: false },
] as const;
