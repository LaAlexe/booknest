import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, switchMap } from 'rxjs';
import { AvailabilityBadge } from '../../components/availability-badge/availability-badge';
import { ReservationForm } from '../../components/reservation-form/reservation-form';
import { Book } from '../../models/catalog.models';
import { Reservation } from '../../models/reservation.models';
import { CatalogApiService } from '../../services/catalog-api.service';
import { LanguageService } from '../../../../shared/services/language.service';

@Component({
  selector: 'app-book-details-page',
  imports: [AvailabilityBadge, ReservationForm, RouterLink, TranslatePipe],
  templateUrl: './book-details-page.html',
  styleUrl: './book-details-page.scss',
})
export class BookDetailsPage implements OnInit {
  private readonly catalogApiService = inject(CatalogApiService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly languageService = inject(LanguageService);

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
    this.languageService.languageChanges
      .pipe(
        switchMap((locale) => {
          this.isLoading.set(true);
          this.hasLoadError.set(false);
          return this.catalogApiService
            .getBook(bookId, locale)
            .pipe(finalize(() => this.isLoading.set(false)));
        }),
        takeUntilDestroyed(this.destroyRef),
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
