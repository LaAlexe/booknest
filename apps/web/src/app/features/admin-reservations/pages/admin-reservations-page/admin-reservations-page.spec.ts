import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { provideTranslationTesting } from '../../../../shared/testing/translation-testing.providers';
import { AdminAuthStore } from '../../../admin-auth/services/admin-auth.store';
import { AdminReservation } from '../../models/admin-reservation.models';
import { AdminReservationsApiService } from '../../services/admin-reservations-api.service';
import { AdminReservationsPage } from './admin-reservations-page';

const reservedReservation: AdminReservation = {
  id: 'reservation-1',
  status: 'RESERVED',
  requesterName: 'Svitlana',
  telegramUsername: '@username',
  reservedAt: '2026-08-11T10:00:00.000Z',
  borrowedAt: null,
  returnedAt: null,
  cancelledAt: null,
  cancellationReason: null,
  handledByAdminId: null,
  book: {
    id: 'book-1',
    title: 'The Hobbit',
    author: 'J. R. R. Tolkien',
    status: 'RESERVED',
  },
};

describe('AdminReservationsPage', () => {
  let pageFixture: ComponentFixture<AdminReservationsPage>;
  let markBorrowedSpy: ReturnType<typeof vi.fn>;
  let markReturnedSpy: ReturnType<typeof vi.fn>;
  let cancelSpy: ReturnType<typeof vi.fn>;
  let getReservationSpy: ReturnType<typeof vi.fn>;

  async function configurePage(
    reservations: AdminReservation[],
    markBorrowedResponse: Observable<AdminReservation> = of({
      ...reservedReservation,
      status: 'BORROWED',
      borrowedAt: '2026-08-11T11:00:00.000Z',
      book: { ...reservedReservation.book, status: 'BORROWED' },
    }),
  ): Promise<void> {
    markBorrowedSpy = vi.fn(() => markBorrowedResponse);
    markReturnedSpy = vi.fn((reservationId: string) =>
      of({
        ...reservations.find((reservation) => reservation.id === reservationId),
        status: 'COMPLETED' as const,
        returnedAt: '2026-08-11T12:00:00.000Z',
        book: { ...reservedReservation.book, status: 'AVAILABLE' as const },
      } as AdminReservation),
    );
    cancelSpy = vi.fn(() =>
      of({
        ...reservedReservation,
        status: 'CANCELLED' as const,
        cancelledAt: '2026-08-11T12:00:00.000Z',
        book: { ...reservedReservation.book, status: 'AVAILABLE' as const },
      }),
    );
    getReservationSpy = vi.fn(() => of(reservedReservation));
    await TestBed.configureTestingModule({
      imports: [AdminReservationsPage],
      providers: [
        provideRouter([]),
        provideTranslationTesting(),
        {
          provide: AdminAuthStore,
          useValue: { logout: vi.fn(() => of({ success: true })) },
        },
        {
          provide: AdminReservationsApiService,
          useValue: {
            getReservations: vi.fn(() =>
              of({
                data: reservations,
                meta: {
                  page: 1,
                  pageSize: 20,
                  total: reservations.length,
                  totalPages: reservations.length ? 1 : 0,
                },
              }),
            ),
            getReservation: getReservationSpy,
            markBorrowed: markBorrowedSpy,
            markReturned: markReturnedSpy,
            cancel: cancelSpy,
          },
        },
      ],
    }).compileComponents();
    pageFixture = TestBed.createComponent(AdminReservationsPage);
    pageFixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('renders requester, Telegram link, and status-specific actions', async () => {
    const borrowedReservation: AdminReservation = {
      ...reservedReservation,
      id: 'reservation-2',
      status: 'BORROWED',
      book: { ...reservedReservation.book, status: 'BORROWED' },
    };
    const completedReservation: AdminReservation = {
      ...reservedReservation,
      id: 'reservation-3',
      status: 'COMPLETED',
      book: { ...reservedReservation.book, status: 'AVAILABLE' },
    };
    const cancelledReservation: AdminReservation = {
      ...completedReservation,
      id: 'reservation-4',
      status: 'CANCELLED',
    };
    await configurePage([
      reservedReservation,
      borrowedReservation,
      completedReservation,
      cancelledReservation,
    ]);

    const pageElement = getPageElement();
    expect(pageElement.textContent).toContain('Svitlana');
    expect(pageElement.textContent).toContain('@username');
    expect(
      pageElement.querySelector<HTMLAnchorElement>(
        'a[href="https://t.me/username"]',
      )?.href,
    ).toBe('https://t.me/username');
    expect(pageElement.textContent).toContain('Mark as borrowed');
    expect(pageElement.textContent).toContain('Mark as returned');
    expect(pageElement.querySelectorAll('.actions')).toHaveLength(4);
    expect(pageElement.textContent?.match(/No actions/g)).toHaveLength(2);
  });

  it('updates the reservation after mark-borrowed and prevents duplicates', async () => {
    const pendingTransition = new Subject<AdminReservation>();
    await configurePage([reservedReservation], pendingTransition);
    const borrowButton = findButton('Mark as borrowed');

    borrowButton.click();
    borrowButton.click();

    expect(markBorrowedSpy).toHaveBeenCalledTimes(1);
    pendingTransition.next({
      ...reservedReservation,
      status: 'BORROWED',
      borrowedAt: '2026-08-11T11:00:00.000Z',
      book: { ...reservedReservation.book, status: 'BORROWED' },
    });
    pendingTransition.complete();
    pageFixture.detectChanges();
    expect(getPageElement().textContent).toContain('Mark as returned');
  });

  it('marks borrowed reservations as returned', async () => {
    const borrowedReservation: AdminReservation = {
      ...reservedReservation,
      status: 'BORROWED',
      book: { ...reservedReservation.book, status: 'BORROWED' },
    };
    await configurePage([borrowedReservation]);

    findButton('Mark as returned').click();
    pageFixture.detectChanges();

    expect(markReturnedSpy).toHaveBeenCalledWith(borrowedReservation.id);
    expect(getPageElement().textContent).toContain('Completed');
  });

  it('cancels reserved reservations with an optional reason', async () => {
    await configurePage([reservedReservation]);
    vi.spyOn(window, 'prompt').mockReturnValue('No longer needed');

    findButton('Cancel').click();
    pageFixture.detectChanges();

    expect(cancelSpy).toHaveBeenCalledWith(
      reservedReservation.id,
      'No longer needed',
    );
    expect(getPageElement().textContent).toContain('Cancelled');
  });

  it('reloads the reservation and explains a 409 conflict', async () => {
    const conflictError = new HttpErrorResponse({ status: 409 });
    await configurePage(
      [reservedReservation],
      throwError(() => conflictError),
    );
    getReservationSpy.mockReturnValue(
      of({
        ...reservedReservation,
        status: 'CANCELLED',
        book: { ...reservedReservation.book, status: 'AVAILABLE' },
      }),
    );

    findButton('Mark as borrowed').click();
    pageFixture.detectChanges();

    expect(getReservationSpy).toHaveBeenCalledWith(reservedReservation.id);
    expect(getPageElement().textContent).toContain(
      'current state has been reloaded',
    );
    expect(getPageElement().textContent).toContain('Cancelled');
  });

  it('shows a safe generic action error', async () => {
    await configurePage(
      [reservedReservation],
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    findButton('Mark as borrowed').click();
    pageFixture.detectChanges();

    expect(getPageElement().textContent).toContain(
      "We couldn't update the reservation",
    );
  });

  function getPageElement(): HTMLElement {
    return pageFixture.nativeElement as HTMLElement;
  }

  function findButton(buttonText: string): HTMLButtonElement {
    const matchingButton = [
      ...getPageElement().querySelectorAll('button'),
    ].find((button) => button.textContent?.trim() === buttonText);
    if (!matchingButton) {
      throw new Error(`Could not find button: ${buttonText}`);
    }
    return matchingButton;
  }
});
