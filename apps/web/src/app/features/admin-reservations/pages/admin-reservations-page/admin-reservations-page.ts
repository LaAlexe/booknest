import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, finalize, Observable } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminNavigation } from '../../../../shared/components/admin-navigation/admin-navigation';
import { LocalizedDatePipe } from '../../../../shared/pipes/localized-date.pipe';
import {
  AdminReservation,
  ReservationStatus,
} from '../../models/admin-reservation.models';
import { AdminReservationsApiService } from '../../services/admin-reservations-api.service';

type ReservationAction = 'borrow' | 'return' | 'cancel';

@Component({
  selector: 'app-admin-reservations-page',
  imports: [AdminNavigation, FormsModule, LocalizedDatePipe, TranslatePipe],
  templateUrl: './admin-reservations-page.html',
  styleUrl: './admin-reservations-page.scss',
})
export class AdminReservationsPage implements OnInit {
  private readonly adminReservationsApiService = inject(
    AdminReservationsApiService,
  );
  private readonly destroyRef = inject(DestroyRef);
  private readonly translateService = inject(TranslateService);
  private readonly pageSize = 20;

  protected readonly reservations = signal<AdminReservation[]>([]);
  protected readonly selectedStatus = signal<ReservationStatus | ''>('');
  protected readonly searchText = signal('');
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(0);
  protected readonly totalReservations = signal(0);
  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);
  protected readonly pendingReservationId = signal<string | null>(null);
  protected readonly hasActionError = signal(false);
  protected readonly hasConflict = signal(false);

  ngOnInit(): void {
    this.loadReservations();
  }

  protected applyFilters(): void {
    this.currentPage.set(1);
    this.loadReservations();
  }

  protected showPreviousPage(): void {
    if (this.currentPage() <= 1) {
      return;
    }
    this.currentPage.update((pageNumber) => pageNumber - 1);
    this.loadReservations();
  }

  protected showNextPage(): void {
    if (this.currentPage() >= this.totalPages()) {
      return;
    }
    this.currentPage.update((pageNumber) => pageNumber + 1);
    this.loadReservations();
  }

  protected telegramUrl(telegramUsername: string): string {
    return `https://t.me/${telegramUsername.replace(/^@/, '')}`;
  }

  protected markBorrowed(reservation: AdminReservation): void {
    this.performAction(reservation, () =>
      this.adminReservationsApiService.markBorrowed(reservation.id),
    );
  }

  protected markReturned(reservation: AdminReservation): void {
    this.performAction(reservation, () =>
      this.adminReservationsApiService.markReturned(reservation.id),
    );
  }

  protected cancelReservation(reservation: AdminReservation): void {
    if (this.pendingReservationId() !== null) {
      return;
    }
    const cancellationReason = window.prompt(
      this.translateService.instant('admin.reservations.cancelPrompt', {
        title: reservation.book.title,
      }),
      '',
    );
    if (cancellationReason === null) {
      return;
    }
    this.performAction(reservation, () =>
      this.adminReservationsApiService.cancel(
        reservation.id,
        cancellationReason.trim() || null,
      ),
    );
  }

  protected actionLabel(
    reservationId: string,
    action: ReservationAction,
  ): string {
    if (this.pendingReservationId() !== reservationId) {
      return this.defaultActionLabel(action);
    }
    return this.pendingActionLabel(action);
  }

  private defaultActionLabel(action: ReservationAction): string {
    switch (action) {
      case 'borrow':
        return 'admin.reservations.markBorrowed';
      case 'return':
        return 'admin.reservations.markReturned';
      case 'cancel':
        return 'admin.reservations.cancel';
    }
  }

  private pendingActionLabel(action: ReservationAction): string {
    switch (action) {
      case 'borrow':
        return 'admin.reservations.markingBorrowed';
      case 'return':
        return 'admin.reservations.markingReturned';
      case 'cancel':
        return 'admin.reservations.cancelling';
    }
  }

  private loadReservations(): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);
    this.adminReservationsApiService
      .getReservations({
        page: this.currentPage(),
        pageSize: this.pageSize,
        status: this.selectedStatus() || undefined,
        q: this.searchText().trim() || undefined,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (reservationsPage) => {
          this.reservations.set(reservationsPage.data);
          this.totalPages.set(reservationsPage.meta.totalPages);
          this.totalReservations.set(reservationsPage.meta.total);
        },
        error: () => this.hasLoadError.set(true),
      });
  }

  private performAction(
    reservation: AdminReservation,
    createActionRequest: () => Observable<AdminReservation>,
  ): void {
    if (this.pendingReservationId() !== null) {
      return;
    }
    this.pendingReservationId.set(reservation.id);
    this.hasActionError.set(false);
    this.hasConflict.set(false);
    createActionRequest()
      .pipe(
        catchError((httpError: unknown) =>
          this.handleActionError(httpError, reservation.id),
        ),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingReservationId.set(null)),
      )
      .subscribe({
        next: (updatedReservation) =>
          this.replaceReservation(updatedReservation),
      });
  }

  private handleActionError(
    httpError: unknown,
    reservationId: string,
  ): Observable<AdminReservation> {
    if (!(httpError instanceof HttpErrorResponse) || httpError.status !== 409) {
      this.hasActionError.set(true);
      return EMPTY;
    }
    this.hasConflict.set(true);
    return this.adminReservationsApiService.getReservation(reservationId).pipe(
      catchError(() => {
        this.hasActionError.set(true);
        return EMPTY;
      }),
    );
  }

  private replaceReservation(updatedReservation: AdminReservation): void {
    this.reservations.update((reservations) =>
      reservations.map((reservation) =>
        reservation.id === updatedReservation.id
          ? updatedReservation
          : reservation,
      ),
    );
  }
}
