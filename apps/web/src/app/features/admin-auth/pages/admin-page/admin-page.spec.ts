import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AdminAuthStore } from '../../services/admin-auth.store';
import { AdminPage } from './admin-page';

describe('AdminPage', () => {
  let adminFixture: ComponentFixture<AdminPage>;
  const logoutSpy = vi.fn(() => of({ success: true as const }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPage],
      providers: [
        provideRouter([]),
        {
          provide: AdminAuthStore,
          useValue: {
            admin: signal({ id: 'admin-1', email: 'admin@example.com' }),
            logout: logoutSpy,
          },
        },
      ],
    }).compileComponents();
    adminFixture = TestBed.createComponent(AdminPage);
    adminFixture.detectChanges();
    vi.clearAllMocks();
  });

  it('renders the signed-in admin and logs out to the login page', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const adminElement = adminFixture.nativeElement as HTMLElement;

    adminElement.querySelector<HTMLButtonElement>('button')?.click();

    expect(adminElement.textContent).toContain('BookNest Admin');
    expect(adminElement.textContent).toContain('admin@example.com');
    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/login']);
  });
});
