import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminAuthApiService } from './admin-auth-api.service';

describe('AdminAuthApiService', () => {
  let adminAuthApiService: AdminAuthApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    adminAuthApiService = TestBed.inject(AdminAuthApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('logs in with credentials enabled', () => {
    const adminLogin = {
      email: 'admin@example.com',
      password: 'strong-password',
    };
    adminAuthApiService.login(adminLogin).subscribe();

    const loginRequest = httpTestingController.expectOne(
      '/api/v1/admin/auth/login',
    );
    expect(loginRequest.request.method).toBe('POST');
    expect(loginRequest.request.body).toEqual(adminLogin);
    expect(loginRequest.request.withCredentials).toBe(true);
    loginRequest.flush({ id: 'admin-1', email: adminLogin.email });
  });

  it('loads the current admin and logs out with credentials enabled', () => {
    adminAuthApiService.getCurrentAdmin().subscribe();
    const currentAdminRequest = httpTestingController.expectOne(
      '/api/v1/admin/auth/me',
    );
    expect(currentAdminRequest.request.withCredentials).toBe(true);
    currentAdminRequest.flush({ id: 'admin-1', email: 'admin@example.com' });

    adminAuthApiService.logout().subscribe();
    const logoutRequest = httpTestingController.expectOne(
      '/api/v1/admin/auth/logout',
    );
    expect(logoutRequest.request.withCredentials).toBe(true);
    logoutRequest.flush({ success: true });
  });
});
