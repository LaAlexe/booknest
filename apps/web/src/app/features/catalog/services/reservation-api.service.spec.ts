import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReservationApiService } from './reservation-api.service';

describe('ReservationApiService', () => {
  let reservationApiService: ReservationApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    reservationApiService = TestBed.inject(ReservationApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('posts a reservation request for the selected book', () => {
    const reservationRequest = {
      requesterName: 'Svitlana',
      telegramUsername: 'username',
    };

    reservationApiService
      .createReservation('book-1', reservationRequest)
      .subscribe();

    const createReservationRequest = httpTestingController.expectOne(
      '/api/v1/books/book-1/reservations',
    );
    expect(createReservationRequest.request.method).toBe('POST');
    expect(createReservationRequest.request.body).toEqual(reservationRequest);
    createReservationRequest.flush({});
  });
});
