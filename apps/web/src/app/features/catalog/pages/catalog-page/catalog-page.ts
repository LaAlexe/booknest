import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  defer,
  EMPTY,
  finalize,
  forkJoin,
  map,
  Observable,
  combineLatest,
  switchMap,
  tap,
} from 'rxjs';
import { AvailabilityBadge } from '../../components/availability-badge/availability-badge';
import {BookCatalog, CatalogFilters, Genre, PaginatedBooks} from '../../models/catalog.models';
import { CatalogApiService } from '../../services/catalog-api.service';
import {
  LanguageService,
  SupportedLanguage,
} from '../../../../shared/services/language.service';

@Component({
  selector: 'app-catalog-page',
  imports: [AvailabilityBadge, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage implements OnInit {
  private readonly catalogApiService = inject(CatalogApiService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly languageService = inject(LanguageService);

  protected readonly searchControl = new FormControl('', {
    nonNullable: true,
  });
  protected readonly genreControl = new FormControl('', {
    nonNullable: true,
  });
  protected readonly catalogPage = signal<PaginatedBooks | null>(null);
  protected readonly availableGenres = signal<Genre[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);
  protected readonly shouldDisplayPagination = computed(
    () => (this.catalogPage()?.meta.totalPages ?? 0) > 1,
  );

  ngOnInit(): void {
    this.subscribeToCatalogFilters();
  }

  protected applyFilters(): void {
    this.navigateToCatalogPage(1);
  }

  protected goToPage(pageNumber: number): void {
    this.navigateToCatalogPage(pageNumber);
  }

  private subscribeToCatalogFilters(): void {
    combineLatest([
      this.activatedRoute.queryParamMap,
      this.languageService.languageChanges,
    ])
      .pipe(
        map(([queryParameters, locale]) => ({
          catalogFilters: this.getCatalogFilters(queryParameters),
          locale,
        })),
        tap(({ catalogFilters }) => {
          this.hasLoadError.set(false);
          this.synchronizeFilterControls(catalogFilters);
        }),
        switchMap(({ catalogFilters, locale }) =>
          this.loadCatalog(catalogFilters, locale),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ catalogPage, availableGenres }) => {
          this.catalogPage.set(catalogPage);
          this.availableGenres.set(availableGenres);
        },
      });
  }

  private getCatalogFilters(queryParameters: ParamMap): CatalogFilters {
    return {
      searchText: queryParameters.get('query') ?? '',
      genreSlug: queryParameters.get('genre') ?? '',
      pageNumber: Math.max(1, Number(queryParameters.get('page')) || 1),
    };
  }

  private synchronizeFilterControls(catalogFilters: CatalogFilters): void {
    this.searchControl.setValue(catalogFilters.searchText, {
      emitEvent: false,
    });
    this.genreControl.setValue(catalogFilters.genreSlug, {
      emitEvent: false,
    });
  }

  private navigateToCatalogPage(pageNumber: number): void {
    const searchText = this.searchControl.value.trim();
    void this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        query: searchText || null,
        genre: this.genreControl.value || null,
        page: pageNumber > 1 ? pageNumber : null,
      },
    });
  }

  private loadCatalog(
    catalogFilters: CatalogFilters,
    locale: SupportedLanguage,
  ): Observable<BookCatalog> {
    return defer(() => {
      this.isLoading.set(true);
      return forkJoin({
        catalogPage: this.catalogApiService.getBooks({
          query: catalogFilters.searchText || undefined,
          genre: catalogFilters.genreSlug || undefined,
          page: catalogFilters.pageNumber,
          locale,
        }),
        availableGenres: this.catalogApiService.getGenres(locale),
      }).pipe(
        catchError(() => {
          this.catalogPage.set(null);
          this.hasLoadError.set(true);
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false)),
      );
    });
  }
}
