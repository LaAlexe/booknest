import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { Book } from '../../models/catalog.models';
import { Reservation } from '../../models/reservation.models';
import { CatalogApiService } from '../../services/catalog-api.service';
import { ReservationApiService } from '../../services/reservation-api.service';
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
const completedReservation: Reservation = {
  id: 'reservation-1',
  bookId: selectedBook.id,
  requesterName: 'Svitlana',
  telegramUsername: '@username',
  status: 'RESERVED',
  reservedAt: '2026-08-11T10:00:00.000Z',
  borrowedAt: null,
  returnedAt: null,
  cancelledAt: null,
  cancellationReason: null,
  createdAt: '2026-08-11T10:00:00.000Z',
  updatedAt: '2026-08-11T10:00:00.000Z',
  book: { status: 'RESERVED' },
};

describe('BookDetailsPage', () => {
  let bookDetailsFixture: ComponentFixture<BookDetailsPage>;

  async function configureBookDetailsTest(
    bookResponse = of(selectedBook),
    reservationResponse: Observable<Reservation> = of(completedReservation),
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
        {
          provide: ReservationApiService,
          useValue: { createReservation: vi.fn(() => reservationResponse) },
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

  it('updates the displayed book status after reservation success', async () => {
    await configureBookDetailsTest(
      of({ ...selectedBook, status: 'AVAILABLE' }),
    );
    const bookDetailsElement = bookDetailsFixture.nativeElement as HTMLElement;
    setInputValue(bookDetailsElement, '#requester-name', 'Svitlana');
    setInputValue(bookDetailsElement, '#telegram-username', '@username');

    submitReservationForm();
    bookDetailsFixture.detectChanges();

    expect(bookDetailsElement.textContent).toContain('Reserved');
    expect(bookDetailsElement.textContent).toContain('Reservation confirmed');
  });

  it('updates the displayed status when reservation availability conflicts', async () => {
    const conflictResponse = new HttpErrorResponse({
      status: 409,
      error: { code: 'BOOK_NOT_AVAILABLE' },
    });
    await configureBookDetailsTest(
      of({ ...selectedBook, status: 'AVAILABLE' }),
      throwError(() => conflictResponse),
    );
    const bookDetailsElement = bookDetailsFixture.nativeElement as HTMLElement;
    setInputValue(bookDetailsElement, '#requester-name', 'Svitlana');
    setInputValue(bookDetailsElement, '#telegram-username', '@username');

    submitReservationForm();
    bookDetailsFixture.detectChanges();

    expect(bookDetailsElement.textContent).toContain('Reserved');
    expect(bookDetailsElement.textContent).toContain('No longer available');
  });

  function setInputValue(
    bookDetailsElement: HTMLElement,
    selector: string,
    inputValue: string,
  ): void {
    const formInput = bookDetailsElement.querySelector(selector);
    expect(formInput).toBeInstanceOf(HTMLInputElement);
    if (!(formInput instanceof HTMLInputElement)) {
      return;
    }
    formInput.value = inputValue;
    formInput.dispatchEvent(new Event('input'));
  }

  function submitReservationForm(): void {
    bookDetailsFixture.debugElement
      .query(By.css('form'))
      .triggerEventHandler('ngSubmit');
  }
});
