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
    path: 'reservations',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('../admin-reservations/pages/admin-reservations-page/admin-reservations-page').then(
        (adminReservationsModule) =>
          adminReservationsModule.AdminReservationsPage,
      ),
    title: 'Manage reservations | BookNest',
  },
  {
    path: 'books/new',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('../admin-books/pages/admin-book-editor-page/admin-book-editor-page').then(
        (bookEditorModule) => bookEditorModule.AdminBookEditorPage,
      ),
    title: 'Add book | BookNest',
  },
  {
    path: 'books/:bookId/edit',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('../admin-books/pages/admin-book-editor-page/admin-book-editor-page').then(
        (bookEditorModule) => bookEditorModule.AdminBookEditorPage,
      ),
    title: 'Edit book | BookNest',
  },
  {
    path: 'books',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('../admin-books/pages/admin-books-page/admin-books-page').then(
        (adminBooksModule) => adminBooksModule.AdminBooksPage,
      ),
    title: 'Manage books | BookNest',
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
