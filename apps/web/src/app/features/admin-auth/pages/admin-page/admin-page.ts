import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminAuthStore } from '../../services/admin-auth.store';

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminPage {
  private readonly adminAuthStore = inject(AdminAuthStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly admin = this.adminAuthStore.admin;
  protected readonly isLoggingOut = signal(false);

  protected logout(): void {
    if (this.isLoggingOut()) {
      return;
    }
    this.isLoggingOut.set(true);
    this.adminAuthStore
      .logout()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoggingOut.set(false)),
      )
      .subscribe({
        next: () => void this.router.navigate(['/admin/login']),
        error: () => void this.router.navigate(['/admin/login']),
      });
  }
}
