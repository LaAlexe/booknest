import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminAuthStore } from '../../services/admin-auth.store';

@Component({
  selector: 'app-admin-login-page',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './admin-login-page.html',
  styleUrl: './admin-login-page.scss',
})
export class AdminLoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminAuthStore = inject(AdminAuthStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(320)],
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(128),
      ],
    ],
  });
  protected readonly hasAttemptedSubmission = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly hasInvalidCredentials = signal(false);
  protected readonly hasLoginError = signal(false);

  protected submitLogin(): void {
    this.hasAttemptedSubmission.set(true);
    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.hasInvalidCredentials.set(false);
    this.hasLoginError.set(false);
    const adminLogin = this.loginForm.getRawValue();
    this.adminAuthStore
      .login({ email: adminLogin.email.trim(), password: adminLogin.password })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => void this.router.navigate(['/admin']),
        error: (loginError: unknown) => this.handleLoginError(loginError),
      });
  }

  protected shouldShowEmailError(): boolean {
    return this.shouldShowControlError(this.loginForm.controls.email);
  }

  protected shouldShowPasswordError(): boolean {
    return this.shouldShowControlError(this.loginForm.controls.password);
  }

  private shouldShowControlError(control: {
    invalid: boolean;
    dirty: boolean;
    touched: boolean;
  }): boolean {
    return (
      control.invalid &&
      (control.dirty || control.touched || this.hasAttemptedSubmission())
    );
  }

  private handleLoginError(loginError: unknown): void {
    if (loginError instanceof HttpErrorResponse && loginError.status === 401) {
      this.hasInvalidCredentials.set(true);
      return;
    }
    this.hasLoginError.set(true);
  }
}
