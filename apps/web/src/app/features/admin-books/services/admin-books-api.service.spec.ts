import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminBooksApiService } from './admin-books-api.service';

describe('AdminBooksApiService', () => {
  let adminBooksApiService: AdminBooksApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    adminBooksApiService = TestBed.inject(AdminBooksApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('uses authenticated admin book endpoints', () => {
    adminBooksApiService.getBooks().subscribe();
    const listRequest = httpTestingController.expectOne('/api/v1/admin/books');
    expect(listRequest.request.withCredentials).toBe(true);
    listRequest.flush([]);

    adminBooksApiService.archiveBook('book-1').subscribe();
    const archiveRequest = httpTestingController.expectOne(
      '/api/v1/admin/books/book-1/archive',
    );
    expect(archiveRequest.request.method).toBe('POST');
    expect(archiveRequest.request.withCredentials).toBe(true);
    archiveRequest.flush({});
  });
});
