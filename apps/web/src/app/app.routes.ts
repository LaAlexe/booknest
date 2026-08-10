import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/catalog/catalog.routes').then(
        (catalogRouteModule) => catalogRouteModule.CATALOG_ROUTES,
      ),
  },
  { path: '**', redirectTo: '' },
];
