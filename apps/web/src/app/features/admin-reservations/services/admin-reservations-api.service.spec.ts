import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminReservationsApiService } from './admin-reservations-api.service';

describe('AdminReservationsApiService', () => {
  let apiService: AdminReservationsApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    apiService = TestBed.inject(AdminReservationsApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('sends authenticated list filters and lifecycle requests', () => {
    apiService
      .getReservations({
        page: 2,
        pageSize: 20,
        status: 'BORROWED',
        q: 'Hobbit',
      })
      .subscribe();
    const listRequest = httpTestingController.expectOne(
      (request) =>
        request.url === '/api/v1/admin/reservations' &&
        request.params.get('status') === 'BORROWED' &&
        request.params.get('q') === 'Hobbit',
    );
    expect(listRequest.request.withCredentials).toBe(true);
    listRequest.flush({ data: [], meta: {} });

    apiService.markBorrowed('reservation-1').subscribe();
    const transitionRequest = httpTestingController.expectOne(
      '/api/v1/admin/reservations/reservation-1/mark-borrowed',
    );
    expect(transitionRequest.request.method).toBe('POST');
    expect(transitionRequest.request.withCredentials).toBe(true);
    transitionRequest.flush({});
  });
});
