import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AdminAuthStore } from '../services/admin-auth.store';
import { adminAuthGuard } from './admin-auth.guard';
import { adminLoginGuard } from './admin-login.guard';

@Component({ template: '' })
class GuardTestPage {}

describe('admin route guards', () => {
  const loadCurrentAdmin = vi.fn();
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'admin/login',
            canActivate: [adminLoginGuard],
            component: GuardTestPage,
          },
          {
            path: 'admin',
            canActivate: [adminAuthGuard],
            component: GuardTestPage,
          },
          {
            path: 'admin/books',
            canActivate: [adminAuthGuard],
            component: GuardTestPage,
          },
          {
            path: 'admin/reservations',
            canActivate: [adminAuthGuard],
            component: GuardTestPage,
          },
        ]),
        { provide: AdminAuthStore, useValue: { loadCurrentAdmin } },
      ],
    });
    router = TestBed.inject(Router);
    vi.clearAllMocks();
  });

  it('allows authenticated admin access', async () => {
    loadCurrentAdmin.mockReturnValue(
      of({ id: 'admin-1', email: 'admin@example.com' }),
    );

    await router.navigateByUrl('/admin');

    expect(router.url).toBe('/admin');
  });

  it('redirects unauthenticated users to the login page', async () => {
    loadCurrentAdmin.mockReturnValue(of(null));

    await router.navigateByUrl('/admin');

    expect(router.url).toBe('/admin/login');
  });

  it('redirects unauthenticated admin book access to login', async () => {
    loadCurrentAdmin.mockReturnValue(of(null));

    await router.navigateByUrl('/admin/books');

    expect(router.url).toBe('/admin/login');
  });

  it('redirects unauthenticated reservation management to login', async () => {
    loadCurrentAdmin.mockReturnValue(of(null));

    await router.navigateByUrl('/admin/reservations');

    expect(router.url).toBe('/admin/login');
  });

  it('redirects authenticated users away from the login page', async () => {
    loadCurrentAdmin.mockReturnValue(
      of({ id: 'admin-1', email: 'admin@example.com' }),
    );

    await router.navigateByUrl('/admin/login');

    expect(router.url).toBe('/admin');
  });
});
