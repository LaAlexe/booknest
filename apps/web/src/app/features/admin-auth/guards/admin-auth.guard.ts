import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AdminAuthStore } from '../services/admin-auth.store';

export const adminAuthGuard: CanActivateFn = () => {
  const adminAuthStore = inject(AdminAuthStore);
  const router = inject(Router);
  return adminAuthStore
    .loadCurrentAdmin()
    .pipe(
      map((admin) => (admin ? true : router.createUrlTree(['/admin/login']))),
    );
};
