import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AvailabilityBadge } from '../../components/availability-badge/availability-badge';
import { ReservationForm } from '../../components/reservation-form/reservation-form';
import { Book } from '../../models/catalog.models';
import { Reservation } from '../../models/reservation.models';
import { CatalogApiService } from '../../services/catalog-api.service';

@Component({
  selector: 'app-book-details-page',
  imports: [AvailabilityBadge, ReservationForm, RouterLink],
  templateUrl: './book-details-page.html',
  styleUrl: './book-details-page.scss',
})
export class BookDetailsPage implements OnInit {
  private readonly catalogApiService = inject(CatalogApiService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly book = signal<Book | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);

  protected handleReservationSuccess(reservation: Reservation): void {
    this.updateBookStatus(reservation.book.status);
  }

  protected handleAvailabilityConflict(): void {
    this.updateBookStatus('RESERVED');
  }

  ngOnInit(): void {
    const bookId = this.activatedRoute.snapshot.paramMap.get('id');
    if (!bookId) {
      this.isLoading.set(false);
      this.hasLoadError.set(true);
      return;
    }
    this.catalogApiService
      .getBook(bookId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (selectedBook) => this.book.set(selectedBook),
        error: () => this.hasLoadError.set(true),
      });
  }

  private updateBookStatus(status: Book['status']): void {
    this.book.update((selectedBook) =>
      selectedBook ? { ...selectedBook, status } : selectedBook,
    );
  }
}
