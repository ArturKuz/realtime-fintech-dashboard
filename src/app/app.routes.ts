import { type Routes } from '@angular/router';
import { APP_NAME } from './app.constants';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: `Dashboard | ${APP_NAME}`,
    loadComponent: () => import('@features/dashboard/dashboard-page').then((m) => m.DashboardPage),
  },
  {
    path: 'settings',
    title: `Settings | ${APP_NAME}`,
    loadComponent: () => import('@features/settings/settings-page').then((m) => m.SettingsPage),
  },
  { path: '**', redirectTo: 'dashboard' },
];
