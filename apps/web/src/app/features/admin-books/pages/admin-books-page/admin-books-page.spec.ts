import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { provideTranslationTesting } from '../../../../shared/testing/translation-testing.providers';
import { AdminAuthStore } from '../../../admin-auth/services/admin-auth.store';
import { AdminBook } from '../../models/admin-book.models';
import { AdminBooksApiService } from '../../services/admin-books-api.service';
import { AdminBooksPage } from './admin-books-page';

const availableBook: AdminBook = {
  id: 'book-1',
  title: 'The Hobbit',
  author: 'J. R. R. Tolkien',
  description: null,
  coverUrl: null,
  status: 'AVAILABLE',
  genreId: 'genre-1',
  genre: { id: 'genre-1', name: 'Fantasy', slug: 'fantasy' },
  translations: {
    en: { title: 'The Hobbit', author: 'J. R. R. Tolkien', description: null },
  },
  isArchived: false,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('AdminBooksPage', () => {
  let booksFixture: ComponentFixture<AdminBooksPage>;
  let archiveBookSpy: ReturnType<typeof vi.fn>;

  async function configureBooksPage(books: AdminBook[]): Promise<void> {
    archiveBookSpy = vi.fn((bookId: string) =>
      of({ ...books.find((book) => book.id === bookId)!, isArchived: true }),
    );
    await TestBed.configureTestingModule({
      imports: [AdminBooksPage],
      providers: [
        provideRouter([]),
        provideTranslationTesting(),
        {
          provide: AdminAuthStore,
          useValue: { logout: vi.fn(() => of({ success: true })) },
        },
        {
          provide: AdminBooksApiService,
          useValue: {
            getBooks: vi.fn(() => of(books)),
            archiveBook: archiveBookSpy,
          },
        },
      ],
    }).compileComponents();
    booksFixture = TestBed.createComponent(AdminBooksPage);
    booksFixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('renders admin books including archived state', async () => {
    await configureBooksPage([
      availableBook,
      {
        ...availableBook,
        id: 'archived-book',
        title: 'Archived',
        isArchived: true,
      },
    ]);

    const booksElement = booksFixture.nativeElement as HTMLElement;
    expect(booksElement.textContent).toContain('The Hobbit');
    expect(booksElement.textContent).toContain('Archived');
    expect(booksElement.textContent).toContain('Fantasy');
  });

  it('confirms and archives an available book', async () => {
    await configureBooksPage([availableBook]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const booksElement = booksFixture.nativeElement as HTMLElement;

    booksElement.querySelector<HTMLButtonElement>('.actions button')?.click();
    booksFixture.detectChanges();

    expect(archiveBookSpy).toHaveBeenCalledWith(availableBook.id);
    expect(booksElement.textContent).toContain('Yes');
  });

  it.each(['RESERVED', 'BORROWED'] as const)(
    'does not offer archive for a %s book',
    async (bookStatus) => {
      await configureBooksPage([{ ...availableBook, status: bookStatus }]);
      const booksElement = booksFixture.nativeElement as HTMLElement;

      expect(booksElement.textContent).toContain('Unavailable');
      expect(booksElement.querySelector('.actions button')).toBeNull();
    },
  );
});
