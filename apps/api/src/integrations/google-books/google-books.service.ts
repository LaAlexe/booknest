import { HttpService } from '@nestjs/axios';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, map, Observable } from 'rxjs';
import {
  ExternalBookSearchResult,
  GoogleBooksImageLinks,
  GoogleBooksIndustryIdentifier,
  GoogleBooksResponse,
  GoogleBooksVolume,
} from './google-books.types';

const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';
const ISBN_PATTERN = /^(?:\d{9}[\dXx]|\d{13})$/;

@Injectable()
export class GoogleBooksService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  searchBooks(query: string): Observable<ExternalBookSearchResult[]> {
    return this.httpService
      .get<GoogleBooksResponse>(GOOGLE_BOOKS_URL, {
        params: {
          q: this.buildGoogleQuery(query),
          key: this.configService.get<string>('GOOGLE_BOOKS_API_KEY', ''),
          maxResults: 10,
          printType: 'books',
        },
      })
      .pipe(
        map((googleResponse) =>
          (googleResponse.data.items ?? []).map((volume) =>
            this.mapVolume(volume),
          ),
        ),
        catchError(() => {
          throw new ServiceUnavailableException(
            'Google Books search is temporarily unavailable',
          );
        }),
      );
  }

  private buildGoogleQuery(query: string): string {
    const trimmedQuery = query.trim();
    const normalizedIsbn = trimmedQuery.replace(/[\s-]/g, '');
    return ISBN_PATTERN.test(normalizedIsbn)
      ? `isbn:${normalizedIsbn}`
      : trimmedQuery;
  }

  private mapVolume(volume: GoogleBooksVolume): ExternalBookSearchResult {
    const volumeInfo = volume.volumeInfo ?? {};
    return {
      externalId: volume.id ?? '',
      title: volumeInfo.title ?? '',
      authors: volumeInfo.authors ?? [],
      description: volumeInfo.description ?? null,
      coverUrl: this.selectCoverUrl(volumeInfo.imageLinks),
      isbn: this.selectIsbn(volumeInfo.industryIdentifiers),
      publishedDate: volumeInfo.publishedDate ?? null,
      language: volumeInfo.language ?? null,
      categories: volumeInfo.categories ?? [],
    };
  }

  private selectIsbn(
    industryIdentifiers: GoogleBooksIndustryIdentifier[] | undefined,
  ): string | null {
    if (!industryIdentifiers) {
      return null;
    }
    const isbn13 = industryIdentifiers.find(
      (industryIdentifier) => industryIdentifier.type === 'ISBN_13',
    );
    const isbn10 = industryIdentifiers.find(
      (industryIdentifier) => industryIdentifier.type === 'ISBN_10',
    );
    return isbn13?.identifier ?? isbn10?.identifier ?? null;
  }

  private selectCoverUrl(
    imageLinks: GoogleBooksImageLinks | undefined,
  ): string | null {
    if (!imageLinks) {
      return null;
    }
    const coverUrl =
      imageLinks.large ??
      imageLinks.medium ??
      imageLinks.small ??
      imageLinks.thumbnail ??
      imageLinks.smallThumbnail;
    return coverUrl ? coverUrl.replace(/^http:\/\//, 'https://') : null;
  }
}
