import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateReservationRequest,
  Reservation,
} from '../models/reservation.models';

@Injectable({ providedIn: 'root' })
export class ReservationApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  createReservation(
    bookId: string,
    reservationRequest: CreateReservationRequest,
  ): Observable<Reservation> {
    return this.httpClient.post<Reservation>(
      `${this.baseUrl}/books/${bookId}/reservations`,
      reservationRequest,
    );
  }
}
