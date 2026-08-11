import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, of, tap } from 'rxjs';
import { AdminLoginRequest, AdminProfile } from '../models/admin-auth.models';
import { AdminAuthApiService } from './admin-auth-api.service';

@Injectable({ providedIn: 'root' })
export class AdminAuthStore {
  private readonly adminAuthApiService = inject(AdminAuthApiService);
  private readonly currentAdmin = signal<AdminProfile | null>(null);
  private readonly isInitialized = signal(false);

  readonly admin = this.currentAdmin.asReadonly();
  readonly isAuthenticated = computed(() => this.currentAdmin() !== null);

  loadCurrentAdmin(): Observable<AdminProfile | null> {
    if (this.isInitialized()) {
      return of(this.currentAdmin());
    }
    return this.adminAuthApiService.getCurrentAdmin().pipe(
      tap((admin) => {
        this.currentAdmin.set(admin);
        this.isInitialized.set(true);
      }),
      catchError(() => {
        this.currentAdmin.set(null);
        this.isInitialized.set(true);
        return of(null);
      }),
    );
  }

  login(adminLogin: AdminLoginRequest): Observable<AdminProfile> {
    return this.adminAuthApiService.login(adminLogin).pipe(
      tap((admin) => {
        this.currentAdmin.set(admin);
        this.isInitialized.set(true);
      }),
    );
  }

  logout(): Observable<{ success: true }> {
    return this.adminAuthApiService.logout().pipe(
      finalize(() => {
        this.currentAdmin.set(null);
        this.isInitialized.set(true);
      }),
    );
  }
}
