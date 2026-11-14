import type { QuickAction } from './types.ts';

/** Every shortcut a student can pin to the home screen (Settings → Quick Access). */
export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'add-class', label: 'Add a class', hint: 'Put a class on your week', icon: 'add', href: '/schedule' },
  { id: 'share-schedule', label: 'Share Schedule', hint: 'Send your week as text', icon: 'ios-share', kind: 'share' },
  { id: 'directions', label: 'Get Directions', hint: 'Browse buildings and walk there', icon: 'near-me', href: '/navigator' },
  { id: 'find-room', label: 'Find a room', hint: 'Floor plans and room search', icon: 'search', href: '/navigator' },
  { id: 'cafeteria', label: 'Check Cafeteria', hint: 'Live line lengths', icon: 'local-cafe', href: '/live' },
  { id: 'study', label: 'Find a study seat', hint: 'Libraries and lounges', icon: 'menu-book', href: '/live' },
  { id: 'free-friends', label: 'Who is free', hint: 'Friends between classes', icon: 'group', href: '/friends' },
  { id: 'report', label: 'Report a wait', hint: 'Help other students', icon: 'campaign', href: '/live' },
  { id: 'settings', label: 'Settings', hint: 'Your account and shortcuts', icon: 'settings', href: '/settings' },
];
