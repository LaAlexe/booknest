import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AdminBookForm } from './admin-book-form';

describe('AdminBookForm', () => {
  let bookFormFixture: ComponentFixture<AdminBookForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBookForm],
    }).compileComponents();
    bookFormFixture = TestBed.createComponent(AdminBookForm);
    bookFormFixture.componentRef.setInput('genres', [
      { id: 'genre-1', name: 'Fantasy', slug: 'fantasy' },
    ]);
    bookFormFixture.detectChanges();
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
      title: 'The Hobbit',
      author: 'J. R. R. Tolkien',
      description: null,
      coverUrl: null,
      genreId: 'genre-1',
    });
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
