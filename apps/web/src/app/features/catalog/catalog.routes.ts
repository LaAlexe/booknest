import { Routes } from '@angular/router';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/catalog-page/catalog-page').then(
        (catalogPageModule) => catalogPageModule.CatalogPage,
      ),
    title: 'Catalog | BookNest',
  },
  {
    path: 'books/:id',
    loadComponent: () =>
      import('./pages/book-details-page/book-details-page').then(
        (bookDetailsModule) => bookDetailsModule.BookDetailsPage,
      ),
    title: 'Book details | BookNest',
  },
];
