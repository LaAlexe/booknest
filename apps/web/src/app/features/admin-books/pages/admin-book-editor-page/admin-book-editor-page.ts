import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, Observable, of } from 'rxjs';
import { Genre } from '../../../catalog/models/catalog.models';
import { CatalogApiService } from '../../../catalog/services/catalog-api.service';
import { AdminBookForm } from '../../components/admin-book-form/admin-book-form';
import { AdminBook, AdminBookInput } from '../../models/admin-book.models';
import { AdminBooksApiService } from '../../services/admin-books-api.service';

@Component({
  selector: 'app-admin-book-editor-page',
  imports: [AdminBookForm, RouterLink],
  templateUrl: './admin-book-editor-page.html',
  styleUrl: './admin-book-editor-page.scss',
})
export class AdminBookEditorPage implements OnInit {
  private readonly adminBooksApiService = inject(AdminBooksApiService);
  private readonly catalogApiService = inject(CatalogApiService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly bookId = this.activatedRoute.snapshot.paramMap.get('bookId');

  protected readonly book = signal<AdminBook | null>(null);
  protected readonly genres = signal<Genre[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly hasSaveError = signal(false);
  protected readonly isEditing = this.bookId !== null;

  ngOnInit(): void {
    const bookRequest: Observable<AdminBook | null> = this.bookId
      ? this.adminBooksApiService.getBook(this.bookId)
      : of(null);
    forkJoin({
      book: bookRequest,
      genres: this.catalogApiService.getGenres(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: ({ book, genres }) => {
          this.book.set(book);
          this.genres.set(genres);
        },
        error: () => this.hasLoadError.set(true),
      });
  }

  protected saveBook(bookInput: AdminBookInput): void {
    if (this.isSaving()) {
      return;
    }
    this.isSaving.set(true);
    this.hasSaveError.set(false);
    const saveRequest = this.bookId
      ? this.adminBooksApiService.updateBook(this.bookId, bookInput)
      : this.adminBooksApiService.createBook(bookInput);
    saveRequest
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => void this.router.navigate(['/admin/books']),
        error: () => this.hasSaveError.set(true),
      });
  }
}
