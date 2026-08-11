import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin-auth/admin.routes').then(
        (adminRouteModule) => adminRouteModule.ADMIN_ROUTES,
      ),
  },
  {
    path: '',
    loadChildren: () =>
      import('./features/catalog/catalog.routes').then(
        (catalogRouteModule) => catalogRouteModule.CATALOG_ROUTES,
      ),
  },
  { path: '**', redirectTo: '' },
];
