import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CatalogApiService } from './catalog-api.service';

describe('CatalogApiService', () => {
  let catalogApiService: CatalogApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    catalogApiService = TestBed.inject(CatalogApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('requests books with catalog query parameters', () => {
    catalogApiService
      .getBooks({ q: 'dune', genre: 'science-fiction', page: 2, pageSize: 10 })
      .subscribe();
    const booksRequest = httpTestingController.expectOne(
      (httpRequest) =>
        httpRequest.url === '/api/v1/books' &&
        httpRequest.params.get('q') === 'dune',
    );
    expect(booksRequest.request.params.get('genre')).toBe('science-fiction');
    expect(booksRequest.request.params.get('page')).toBe('2');
    expect(booksRequest.request.params.get('pageSize')).toBe('10');
    booksRequest.flush({
      data: [],
      meta: { page: 2, pageSize: 10, total: 0, totalPages: 0 },
    });
  });

  it('requests a book and genres', () => {
    catalogApiService.getBook('book-1').subscribe();
    httpTestingController.expectOne('/api/v1/books/book-1?locale=en').flush({});
    catalogApiService.getGenres().subscribe();
    httpTestingController.expectOne('/api/v1/genres?locale=en').flush([]);
  });
});
