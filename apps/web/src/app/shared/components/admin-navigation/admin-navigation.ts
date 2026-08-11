import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminAuthStore } from '../../../features/admin-auth/services/admin-auth.store';

@Component({
  selector: 'app-admin-navigation',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './admin-navigation.html',
  styleUrl: './admin-navigation.scss',
})
export class AdminNavigation {
  private readonly adminAuthStore = inject(AdminAuthStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

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
