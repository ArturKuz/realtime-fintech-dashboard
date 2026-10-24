import { type NavLink } from './app.model';

export const APP_NAME = 'Realtime Fintech Dashboard';

/** Main navigation, in display order. */
export const NAV_LINKS: readonly NavLink[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/settings', label: 'Settings' },
];
