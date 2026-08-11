import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminNavigation } from '../../../../shared/components/admin-navigation/admin-navigation';
import { AdminBook } from '../../models/admin-book.models';
import { AdminBooksApiService } from '../../services/admin-books-api.service';
import { LanguageService } from '../../../../shared/services/language.service';

@Component({
  selector: 'app-admin-books-page',
  imports: [AdminNavigation, RouterLink, TranslatePipe],
  templateUrl: './admin-books-page.html',
  styleUrl: './admin-books-page.scss',
})
export class AdminBooksPage implements OnInit {
  private readonly adminBooksApiService = inject(AdminBooksApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translateService = inject(TranslateService);
  private readonly languageService = inject(LanguageService);

  protected readonly books = signal<AdminBook[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);
  protected readonly archivingBookId = signal<string | null>(null);
  protected readonly hasArchiveError = signal(false);

  ngOnInit(): void {
    this.languageService.languageChanges
      .pipe(
        switchMap((locale) => {
          this.isLoading.set(true);
          this.hasLoadError.set(false);
          return this.adminBooksApiService.getBooks(locale);
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (books) => {
          this.books.set(books);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasLoadError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  protected canArchive(book: AdminBook): boolean {
    return book.status === 'AVAILABLE' && !book.isArchived;
  }

  protected archiveBook(book: AdminBook): void {
    if (
      !this.canArchive(book) ||
      this.archivingBookId() !== null ||
      !window.confirm(
        this.translateService.instant('admin.books.archiveConfirmation', {
          title: book.title,
        }),
      )
    ) {
      return;
    }
    this.archivingBookId.set(book.id);
    this.hasArchiveError.set(false);
    this.adminBooksApiService
      .archiveBook(book.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.archivingBookId.set(null)),
      )
      .subscribe({
        next: (archivedBook) => this.replaceBook(archivedBook),
        error: () => this.hasArchiveError.set(true),
      });
  }

  private replaceBook(updatedBook: AdminBook): void {
    this.books.update((books) =>
      books.map((book) => (book.id === updatedBook.id ? updatedBook : book)),
    );
  }
}
