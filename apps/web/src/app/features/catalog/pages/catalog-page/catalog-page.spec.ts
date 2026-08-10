import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
} from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { Book, PaginatedBooks } from '../../models/catalog.models';
import { CatalogApiService } from '../../services/catalog-api.service';
import { CatalogPage } from './catalog-page';

const catalogBook: Book = {
  id: 'book-1',
  title: 'Dune',
  author: 'Frank Herbert',
  description: 'Desert epic',
  coverUrl: null,
  status: 'AVAILABLE',
  genre: {
    id: 'g1',
    name: 'Science Fiction',
    slug: 'science-fiction',
  },
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};
const createCatalogPage = (
  books: Book[] = [catalogBook],
  currentPage = 1,
  totalPages = 2,
): PaginatedBooks => ({
  data: books,
  meta: {
    page: currentPage,
    pageSize: 20,
    total: books.length,
    totalPages,
  },
});

describe('CatalogPage', () => {
  let catalogFixture: ComponentFixture<CatalogPage>;
  let queryParameters: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let catalogApiServiceMock: {
    getBooks: ReturnType<typeof vi.fn>;
    getGenres: ReturnType<typeof vi.fn>;
  };

  async function configureCatalogTest(
    booksResponse = of(createCatalogPage()),
  ): Promise<void> {
    queryParameters = new BehaviorSubject(convertToParamMap({}));
    catalogApiServiceMock = {
      getBooks: vi.fn(() => booksResponse),
      getGenres: vi.fn(() => of([catalogBook.genre])),
    };
    await TestBed.configureTestingModule({
      imports: [CatalogPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParameters,
            snapshot: { paramMap: convertToParamMap({}) },
          },
        },
        { provide: CatalogApiService, useValue: catalogApiServiceMock },
      ],
    }).compileComponents();
    catalogFixture = TestBed.createComponent(CatalogPage);
    catalogFixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('renders catalog books and their availability', async () => {
    await configureCatalogTest();
    const catalogElement = catalogFixture.nativeElement as HTMLElement;
    expect(catalogElement.textContent).toContain('Dune');
    expect(catalogElement.textContent).toContain('Frank Herbert');
    expect(catalogElement.textContent).toContain('Science Fiction');
    expect(catalogElement.textContent).toContain('Available');
  });

  it('applies a title or author search', async () => {
    await configureCatalogTest();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const catalogElement = catalogFixture.nativeElement as HTMLElement;
    const searchInput = catalogElement.querySelector('input');
    expect(searchInput).toBeInstanceOf(HTMLInputElement);
    if (!(searchInput instanceof HTMLInputElement)) return;
    searchInput.value = '  Herbert  ';
    searchInput.dispatchEvent(new Event('input'));
    catalogFixture.detectChanges();
    catalogFixture.debugElement
      .query(By.css('form'))
      .triggerEventHandler('ngSubmit');
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({ q: 'Herbert' }),
      }),
    );
  });

  it('applies a genre filter', async () => {
    await configureCatalogTest();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const catalogElement = catalogFixture.nativeElement as HTMLElement;
    const genreSelect = catalogElement.querySelector('select');
    expect(genreSelect).toBeInstanceOf(HTMLSelectElement);
    if (!(genreSelect instanceof HTMLSelectElement)) return;
    genreSelect.value = 'science-fiction';
    genreSelect.dispatchEvent(new Event('change'));
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({ genre: 'science-fiction' }),
      }),
    );
  });

  it('navigates through paginated results', async () => {
    await configureCatalogTest(of(createCatalogPage([catalogBook], 1, 3)));
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const catalogElement = catalogFixture.nativeElement as HTMLElement;
    const paginationButtons =
      catalogElement.querySelectorAll<HTMLButtonElement>('.pagination button');
    paginationButtons[1].click();
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({ page: 2 }),
      }),
    );
  });

  it('shows a loading state', async () => {
    await configureCatalogTest(new Subject<PaginatedBooks>());
    const catalogElement = catalogFixture.nativeElement as HTMLElement;
    expect(catalogElement.textContent).toContain('Loading books');
  });

  it('shows an empty state', async () => {
    await configureCatalogTest(of(createCatalogPage([], 1, 0)));
    const catalogElement = catalogFixture.nativeElement as HTMLElement;
    expect(catalogElement.textContent).toContain('No books found');
  });

  it('shows an error state', async () => {
    await configureCatalogTest(
      throwError(() => new Error('Catalog request failed')),
    );
    const catalogElement = catalogFixture.nativeElement as HTMLElement;
    expect(
      catalogElement.querySelector('[role="alert"]')?.textContent,
    ).toContain("couldn't load");
  });
});
