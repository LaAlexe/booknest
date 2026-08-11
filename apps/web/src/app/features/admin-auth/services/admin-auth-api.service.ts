import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminLoginRequest, AdminProfile } from '../models/admin-auth.models';

@Injectable({ providedIn: 'root' })
export class AdminAuthApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = '/api/v1/admin/auth';

  login(adminLogin: AdminLoginRequest): Observable<AdminProfile> {
    return this.httpClient.post<AdminProfile>(
      `${this.baseUrl}/login`,
      adminLogin,
      { withCredentials: true },
    );
  }

  logout(): Observable<{ success: true }> {
    return this.httpClient.post<{ success: true }>(
      `${this.baseUrl}/logout`,
      {},
      { withCredentials: true },
    );
  }

  getCurrentAdmin(): Observable<AdminProfile> {
    return this.httpClient.get<AdminProfile>(`${this.baseUrl}/me`, {
      withCredentials: true,
    });
  }
}
