import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Book } from '../../models/catalog.models';
import { CatalogApiService } from '../../services/catalog-api.service';
import { BookDetailsPage } from './book-details-page';

const selectedBook: Book = {
  id: 'book-1',
  title: 'The Hobbit',
  author: 'J. R. R. Tolkien',
  description: 'A great adventure.',
  coverUrl: null,
  status: 'BORROWED',
  genre: { id: 'g1', name: 'Fantasy', slug: 'fantasy' },
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('BookDetailsPage', () => {
  let bookDetailsFixture: ComponentFixture<BookDetailsPage>;

  async function configureBookDetailsTest(
    bookResponse = of(selectedBook),
  ): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [BookDetailsPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'book-1' }) },
          },
        },
        {
          provide: CatalogApiService,
          useValue: { getBook: vi.fn(() => bookResponse) },
        },
      ],
    }).compileComponents();
    bookDetailsFixture = TestBed.createComponent(BookDetailsPage);
    bookDetailsFixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('renders book details and availability', async () => {
    await configureBookDetailsTest();
    const bookDetailsElement = bookDetailsFixture.nativeElement as HTMLElement;
    const renderedBookDetails = bookDetailsElement.textContent;
    expect(renderedBookDetails).toContain('The Hobbit');
    expect(renderedBookDetails).toContain('J. R. R. Tolkien');
    expect(renderedBookDetails).toContain('Fantasy');
    expect(renderedBookDetails).toContain('Borrowed');
    expect(renderedBookDetails).toContain('A great adventure.');
  });

  it('shows loading and error states', async () => {
    await configureBookDetailsTest(new Subject<Book>());
    const loadingElement = bookDetailsFixture.nativeElement as HTMLElement;
    expect(loadingElement.textContent).toContain('Loading book');
    TestBed.resetTestingModule();
    await configureBookDetailsTest(
      throwError(() => new Error('Book not found')),
    );
    const errorElement = bookDetailsFixture.nativeElement as HTMLElement;
    expect(errorElement.querySelector('[role="alert"]')).toBeTruthy();
  });
});
