import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTranslationTesting } from '../../../../shared/testing/translation-testing.providers';
import { AdminBookForm } from './admin-book-form';

describe('AdminBookForm', () => {
  let bookFormFixture: ComponentFixture<AdminBookForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBookForm],
      providers: [provideRouter([]), provideTranslationTesting()],
    }).compileComponents();
    bookFormFixture = TestBed.createComponent(AdminBookForm);
    bookFormFixture.componentRef.setInput('genres', [
      { id: 'genre-1', name: 'Fantasy', slug: 'fantasy' },
    ]);
    bookFormFixture.detectChanges();
  });

  it('renders separate English and Ukrainian metadata sections', () => {
    const bookFormText = getBookFormElement().textContent;

    expect(bookFormText).toContain('English');
    expect(bookFormText).toContain('Required fallback content');
    expect(bookFormText).toContain('Українська');
    expect(bookFormText).toContain('Optional Ukrainian translation');
  });

  it('shows validation errors and does not save an invalid book', () => {
    const saveSpy = vi.fn();
    bookFormFixture.componentInstance.saveBook.subscribe(saveSpy);

    submitForm();
    bookFormFixture.detectChanges();

    expect(getBookFormElement().textContent).toContain('Enter a title');
    expect(getBookFormElement().textContent).toContain('Enter an author');
    expect(getBookFormElement().textContent).toContain('Select a genre');
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('emits trimmed catalog fields without a status field', () => {
    const saveSpy = vi.fn();
    bookFormFixture.componentInstance.saveBook.subscribe(saveSpy);
    setInput('#book-title', ' The Hobbit ');
    setInput('#book-author', ' J. R. R. Tolkien ');
    setInput('#book-genre', 'genre-1');

    submitForm();

    expect(saveSpy).toHaveBeenCalledWith({
      translations: {
        en: {
          title: 'The Hobbit',
          author: 'J. R. R. Tolkien',
          description: null,
        },
      },
      coverUrl: null,
      genreId: 'genre-1',
    });
  });

  it('emits optional Ukrainian translation fields when supplied', () => {
    const saveSpy = vi.fn();
    bookFormFixture.componentInstance.saveBook.subscribe(saveSpy);
    setInput('#book-title', 'The Hobbit');
    setInput('#book-author', 'J. R. R. Tolkien');
    setInput('#book-title-uk', ' Гобіт ');
    setInput('#book-author-uk', ' Дж. Р. Р. Толкін ');
    setInput('#book-genre', 'genre-1');

    submitForm();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        translations: {
          en: {
            title: 'The Hobbit',
            author: 'J. R. R. Tolkien',
            description: null,
          },
          uk: {
            title: 'Гобіт',
            author: 'Дж. Р. Р. Толкін',
            description: null,
          },
        },
      }),
    );
  });

  it('rejects a partial Ukrainian translation', () => {
    const saveSpy = vi.fn();
    bookFormFixture.componentInstance.saveBook.subscribe(saveSpy);
    setInput('#book-title', 'The Hobbit');
    setInput('#book-author', 'J. R. R. Tolkien');
    setInput('#book-title-uk', 'Гобіт');
    setInput('#book-genre', 'genre-1');

    submitForm();
    bookFormFixture.detectChanges();

    expect(getBookFormElement().textContent).toContain(
      'Enter both Ukrainian title and author',
    );
    expect(saveSpy).not.toHaveBeenCalled();
  });

  function getBookFormElement(): HTMLElement {
    return bookFormFixture.nativeElement as HTMLElement;
  }

  function setInput(selector: string, inputValue: string): void {
    const formControl = getBookFormElement().querySelector(selector);
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
    bookFormFixture.debugElement
      .query(By.css('form'))
      .triggerEventHandler('ngSubmit');
  }
});
