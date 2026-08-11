import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AdminProfile } from '../../models/admin-auth.models';
import { AdminAuthStore } from '../../services/admin-auth.store';
import { AdminLoginPage } from './admin-login-page';

describe('AdminLoginPage', () => {
  let loginFixture: ComponentFixture<AdminLoginPage>;
  let loginSpy: ReturnType<typeof vi.fn>;

  async function configureLoginPage(
    loginResponse: Observable<AdminProfile> = of({
      id: 'admin-1',
      email: 'admin@example.com',
    }),
  ): Promise<void> {
    loginSpy = vi.fn(() => loginResponse);
    await TestBed.configureTestingModule({
      imports: [AdminLoginPage],
      providers: [
        provideRouter([]),
        { provide: AdminAuthStore, useValue: { login: loginSpy } },
      ],
    }).compileComponents();
    loginFixture = TestBed.createComponent(AdminLoginPage);
    loginFixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('shows validation only after attempted submission', async () => {
    await configureLoginPage();
    expect(getLoginElement().querySelector('.field-error')).toBeNull();

    submitLoginForm();
    loginFixture.detectChanges();

    expect(getLoginElement().textContent).toContain('valid email address');
    expect(getLoginElement().textContent).toContain('at least 12 characters');
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('logs in and navigates to the protected admin page', async () => {
    await configureLoginPage();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    completeLoginForm();

    submitLoginForm();

    expect(loginSpy).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'strong-password',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/admin']);
  });

  it('shows a generic invalid-credentials error for HTTP 401', async () => {
    await configureLoginPage(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );
    completeLoginForm();

    submitLoginForm();
    loginFixture.detectChanges();

    expect(
      getLoginElement().querySelector('[role="alert"]')?.textContent,
    ).toContain('Invalid email or password');
  });

  function getLoginElement(): HTMLElement {
    return loginFixture.nativeElement as HTMLElement;
  }

  function completeLoginForm(): void {
    setInput('#admin-email', ' admin@example.com ');
    setInput('#admin-password', 'strong-password');
  }

  function setInput(selector: string, inputValue: string): void {
    const formInput = getLoginElement().querySelector(selector);
    expect(formInput).toBeInstanceOf(HTMLInputElement);
    if (!(formInput instanceof HTMLInputElement)) {
      return;
    }
    formInput.value = inputValue;
    formInput.dispatchEvent(new Event('input'));
  }

  function submitLoginForm(): void {
    loginFixture.debugElement
      .query(By.css('form'))
      .triggerEventHandler('ngSubmit');
  }
});
