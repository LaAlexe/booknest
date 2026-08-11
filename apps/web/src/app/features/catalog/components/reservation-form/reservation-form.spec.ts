import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, of, Subject, throwError } from 'rxjs';
import { provideTranslationTesting } from '../../../../shared/testing/translation-testing.providers';
import { LanguageService } from '../../../../shared/services/language.service';
import { BookStatus } from '../../models/catalog.models';
import { Reservation } from '../../models/reservation.models';
import { ReservationApiService } from '../../services/reservation-api.service';
import { ReservationForm } from './reservation-form';

const successfulReservation: Reservation = {
  id: 'reservation-1',
  bookId: 'book-1',
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

describe('ReservationForm', () => {
  let reservationFixture: ComponentFixture<ReservationForm>;
  let createReservationSpy: ReturnType<typeof vi.fn>;

  async function configureReservationFormTest(
    bookStatus: BookStatus = 'AVAILABLE',
    reservationResponse: Observable<Reservation> = of(successfulReservation),
  ): Promise<void> {
    createReservationSpy = vi.fn(() => reservationResponse);
    await TestBed.configureTestingModule({
      imports: [ReservationForm],
      providers: [
        provideTranslationTesting(),
        {
          provide: ReservationApiService,
          useValue: { createReservation: createReservationSpy },
        },
      ],
    }).compileComponents();
    reservationFixture = TestBed.createComponent(ReservationForm);
    reservationFixture.componentRef.setInput('bookId', 'book-1');
    reservationFixture.componentRef.setInput('bookStatus', bookStatus);
    reservationFixture.detectChanges();
  }

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('shows the Reserve action for an available book', async () => {
    await configureReservationFormTest();

    expect(
      getReservationElement().querySelector('button')?.textContent,
    ).toContain('Reserve');
  });

  it.each<BookStatus>(['RESERVED', 'BORROWED'])(
    'prevents reservations when the book is %s',
    async (bookStatus) => {
      await configureReservationFormTest(bookStatus);
      const reservationElement = getReservationElement();

      expect(reservationElement.querySelector('form')).toBeNull();
      expect(reservationElement.textContent).toContain('Currently unavailable');
      expect(createReservationSpy).not.toHaveBeenCalled();
    },
  );

  it('shows requester name validation only after submission', async () => {
    await configureReservationFormTest();
    expect(getReservationElement().querySelector('.field-error')).toBeNull();

    submitForm();
    reservationFixture.detectChanges();

    expect(getReservationElement().textContent).toContain('Enter your name');
    expect(createReservationSpy).not.toHaveBeenCalled();
  });

  it('translates reservation validation messages into Ukrainian', async () => {
    await configureReservationFormTest();
    TestBed.inject(LanguageService).setLanguage('uk');
    submitForm();
    reservationFixture.detectChanges();

    expect(getReservationElement().textContent).toContain('Введіть ім’я');
  });

  it.each(['   ', '@bad-name'])(
    'rejects invalid Telegram username %p',
    async (invalidTelegramUsername) => {
      await configureReservationFormTest();
      setFormInput('#requester-name', 'Svitlana');
      setFormInput('#telegram-username', invalidTelegramUsername);

      submitForm();
      reservationFixture.detectChanges();

      expect(getReservationElement().textContent).toContain(
        '5–32 letters, numbers, or underscores',
      );
      expect(createReservationSpy).not.toHaveBeenCalled();
    },
  );

  it('submits valid reservation details', async () => {
    await configureReservationFormTest();
    completeValidForm();

    submitForm();

    expect(createReservationSpy).toHaveBeenCalledWith('book-1', {
      requesterName: 'Svitlana',
      telegramUsername: 'Username',
    });
  });

  it('prevents duplicate submissions while a request is pending', async () => {
    const pendingReservation = new Subject<Reservation>();
    await configureReservationFormTest('AVAILABLE', pendingReservation);
    completeValidForm();

    submitForm();
    submitForm();
    reservationFixture.detectChanges();

    expect(createReservationSpy).toHaveBeenCalledTimes(1);
    expect(
      getReservationElement().querySelector('button')?.textContent,
    ).toContain('Reserving');
  });

  it('shows the success state and normalized Telegram username', async () => {
    await configureReservationFormTest();
    completeValidForm();

    submitForm();
    reservationFixture.detectChanges();

    const reservationElement = getReservationElement();
    expect(reservationElement.textContent).toContain('Reservation confirmed');
    expect(reservationElement.textContent).toContain('@username');
    expect(reservationElement.querySelector('form')).toBeNull();
  });

  it('handles BOOK_NOT_AVAILABLE conflicts and prevents retrying', async () => {
    const conflictResponse = new HttpErrorResponse({
      status: 409,
      error: { code: 'BOOK_NOT_AVAILABLE' },
    });
    await configureReservationFormTest(
      'AVAILABLE',
      throwError(() => conflictResponse),
    );
    completeValidForm();

    submitForm();
    reservationFixture.detectChanges();

    const reservationElement = getReservationElement();
    expect(reservationElement.textContent).toContain('No longer available');
    expect(reservationElement.querySelector('form')).toBeNull();
  });

  it('shows a generic message for unexpected API errors', async () => {
    await configureReservationFormTest(
      'AVAILABLE',
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    completeValidForm();

    submitForm();
    reservationFixture.detectChanges();

    expect(
      getReservationElement().querySelector('[role="alert"]')?.textContent,
    ).toContain("couldn't complete");
  });

  function getReservationElement(): HTMLElement {
    return reservationFixture.nativeElement as HTMLElement;
  }

  function completeValidForm(): void {
    setFormInput('#requester-name', '  Svitlana  ');
    setFormInput('#telegram-username', ' Username ');
  }

  function setFormInput(selector: string, inputValue: string): void {
    const formInput = getReservationElement().querySelector(selector);
    expect(formInput).toBeInstanceOf(HTMLInputElement);
    if (!(formInput instanceof HTMLInputElement)) {
      return;
    }
    formInput.value = inputValue;
    formInput.dispatchEvent(new Event('input'));
  }

  function submitForm(): void {
    reservationFixture.debugElement
      .query(By.css('form'))
      .triggerEventHandler('ngSubmit');
  }
});
