import { type Routes } from '@angular/router';

const APP_NAME = 'Realtime Fintech Dashboard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: `Dashboard | ${APP_NAME}`,
    loadComponent: () => import('./features/dashboard/dashboard-page').then((m) => m.DashboardPage),
  },
  {
    path: 'settings',
    title: `Settings | ${APP_NAME}`,
    loadComponent: () => import('./features/settings/settings-page').then((m) => m.SettingsPage),
  },
  { path: '**', redirectTo: 'dashboard' },
];
