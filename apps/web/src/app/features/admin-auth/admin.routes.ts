import { Routes } from '@angular/router';
import { adminAuthGuard } from './guards/admin-auth.guard';
import { adminLoginGuard } from './guards/admin-login.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [adminLoginGuard],
    loadComponent: () =>
      import('./pages/admin-login-page/admin-login-page').then(
        (adminLoginModule) => adminLoginModule.AdminLoginPage,
      ),
    title: 'Admin login | BookNest',
  },
  {
    path: '',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./pages/admin-page/admin-page').then(
        (adminPageModule) => adminPageModule.AdminPage,
      ),
    title: 'Admin | BookNest',
  },
];
