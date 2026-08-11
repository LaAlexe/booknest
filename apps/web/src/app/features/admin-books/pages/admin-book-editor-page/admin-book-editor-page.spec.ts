import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
} from '@angular/router';
import { of } from 'rxjs';
import { provideTranslationTesting } from '../../../../shared/testing/translation-testing.providers';
import { AdminAuthStore } from '../../../admin-auth/services/admin-auth.store';
import { CatalogApiService } from '../../../catalog/services/catalog-api.service';
import { AdminBook } from '../../models/admin-book.models';
import { AdminBooksApiService } from '../../services/admin-books-api.service';
import { AdminBookEditorPage } from './admin-book-editor-page';

const existingBook: AdminBook = {
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
    uk: { title: 'Гобіт', author: 'Дж. Р. Р. Толкін', description: null },
  },
  isArchived: false,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('AdminBookEditorPage', () => {
  let editorFixture: ComponentFixture<AdminBookEditorPage>;
  let createBookSpy: ReturnType<typeof vi.fn>;
  let updateBookSpy: ReturnType<typeof vi.fn>;

  async function configureEditor(bookId: string | null): Promise<void> {
    createBookSpy = vi.fn(() => of(existingBook));
    updateBookSpy = vi.fn(() => of(existingBook));
    await TestBed.configureTestingModule({
      imports: [AdminBookEditorPage],
      providers: [
        provideTranslationTesting(),
        provideRouter([
          {
            path: 'admin/books',
            component: AdminBookEditorPage,
          },
        ]),
        {
          provide: AdminAuthStore,
          useValue: { logout: vi.fn(() => of({ success: true })) },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(bookId ? { bookId } : {}),
            },
          },
        },
        {
          provide: AdminBooksApiService,
          useValue: {
            getBook: vi.fn(() => of(existingBook)),
            createBook: createBookSpy,
            updateBook: updateBookSpy,
          },
        },
        {
          provide: CatalogApiService,
          useValue: { getGenres: vi.fn(() => of([existingBook.genre])) },
        },
      ],
    }).compileComponents();
    editorFixture = TestBed.createComponent(AdminBookEditorPage);
    editorFixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('creates a book and returns to the list', async () => {
    await configureEditor(null);
    const navigateSpy = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    completeBookForm('New Book');

    submitForm();

    expect(createBookSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        translations: expect.objectContaining({
          en: expect.objectContaining({ title: 'New Book' }),
        }),
        genreId: 'genre-1',
      }),
    );
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/books']);
  });

  it('loads and updates an existing book', async () => {
    await configureEditor(existingBook.id);
    completeBookForm('Updated Book');
    setInput('#book-title-uk', 'Оновлений Гобіт');
    setInput('#book-author-uk', 'Дж. Р. Р. Толкін');

    submitForm();

    expect(updateBookSpy).toHaveBeenCalledWith(
      existingBook.id,
      expect.objectContaining({
        translations: expect.objectContaining({
          en: expect.objectContaining({ title: 'Updated Book' }),
          uk: expect.objectContaining({ title: 'Оновлений Гобіт' }),
        }),
      }),
    );
  });

  function completeBookForm(title: string): void {
    setInput('#book-title', title);
    setInput('#book-author', existingBook.author);
    setInput('#book-genre', existingBook.genreId);
  }

  function setInput(selector: string, inputValue: string): void {
    const editorElement = editorFixture.nativeElement as HTMLElement;
    const formControl = editorElement.querySelector(selector);
    expect(formControl).not.toBeNull();
    if (!(
      formControl instanceof HTMLInputElement ||
      formControl instanceof HTMLSelectElement
    )) {
      return;
    }
    formControl.value = inputValue;
    formControl.dispatchEvent(new Event('input'));
    formControl.dispatchEvent(new Event('change'));
  }

  function submitForm(): void {
    editorFixture.debugElement
      .query(By.css('form'))
      .triggerEventHandler('ngSubmit');
  }
});
