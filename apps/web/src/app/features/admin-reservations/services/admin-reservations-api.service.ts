import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminReservation,
  AdminReservationFilters,
  AdminReservationsPage,
} from '../models/admin-reservation.models';

@Injectable({ providedIn: 'root' })
export class AdminReservationsApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly reservationsUrl = '/api/v1/admin/reservations';

  getReservations(
    filters: AdminReservationFilters,
  ): Observable<AdminReservationsPage> {
    let queryParameters = new HttpParams()
      .set('page', filters.page)
      .set('pageSize', filters.pageSize);
    if (filters.status) {
      queryParameters = queryParameters.set('status', filters.status);
    }
    if (filters.q) {
      queryParameters = queryParameters.set('q', filters.q);
    }
    return this.httpClient.get<AdminReservationsPage>(this.reservationsUrl, {
      params: queryParameters,
      withCredentials: true,
    });
  }

  getReservation(reservationId: string): Observable<AdminReservation> {
    return this.httpClient.get<AdminReservation>(
      `${this.reservationsUrl}/${reservationId}`,
      { withCredentials: true },
    );
  }

  markBorrowed(reservationId: string): Observable<AdminReservation> {
    return this.postTransition(reservationId, 'mark-borrowed', {});
  }

  markReturned(reservationId: string): Observable<AdminReservation> {
    return this.postTransition(reservationId, 'mark-returned', {});
  }

  cancel(
    reservationId: string,
    cancellationReason: string | null,
  ): Observable<AdminReservation> {
    return this.postTransition(reservationId, 'cancel', {
      cancellationReason,
    });
  }

  private postTransition(
    reservationId: string,
    action: string,
    requestBody: object,
  ): Observable<AdminReservation> {
    return this.httpClient.post<AdminReservation>(
      `${this.reservationsUrl}/${reservationId}/${action}`,
      requestBody,
      { withCredentials: true },
    );
  }
}
