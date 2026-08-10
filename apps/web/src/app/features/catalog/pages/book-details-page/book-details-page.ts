import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AvailabilityBadge } from '../../components/availability-badge/availability-badge';
import { Book } from '../../models/catalog.models';
import { CatalogApiService } from '../../services/catalog-api.service';

@Component({
  selector: 'app-book-details-page',
  imports: [AvailabilityBadge, RouterLink],
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
}
