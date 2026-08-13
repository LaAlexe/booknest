import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminBook,
  AdminBookInput,
  ExternalBookSearchResult,
} from '../models/admin-book.models';
import { SupportedLanguage } from '../../../shared/services/language.service';

@Injectable({ providedIn: 'root' })
export class AdminBooksApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = '/api/v1/admin/books';

  getBooks(locale: SupportedLanguage = 'en'): Observable<AdminBook[]> {
    return this.httpClient.get<AdminBook[]>(this.baseUrl, {
      params: { locale },
      withCredentials: true,
    });
  }

  getBook(
    bookId: string,
    locale: SupportedLanguage = 'en',
  ): Observable<AdminBook> {
    return this.httpClient.get<AdminBook>(`${this.baseUrl}/${bookId}`, {
      params: { locale },
      withCredentials: true,
    });
  }

  createBook(bookInput: AdminBookInput): Observable<AdminBook> {
    return this.httpClient.post<AdminBook>(this.baseUrl, bookInput, {
      withCredentials: true,
    });
  }

  updateBook(bookId: string, bookInput: AdminBookInput): Observable<AdminBook> {
    return this.httpClient.patch<AdminBook>(
      `${this.baseUrl}/${bookId}`,
      bookInput,
      { withCredentials: true },
    );
  }

  archiveBook(bookId: string): Observable<AdminBook> {
    return this.httpClient.post<AdminBook>(
      `${this.baseUrl}/${bookId}/archive`,
      {},
      { withCredentials: true },
    );
  }

  searchExternalBooks(query: string): Observable<ExternalBookSearchResult[]> {
    const searchParameters = new HttpParams().set('q', query);
    return this.httpClient.get<ExternalBookSearchResult[]>(
      `${this.baseUrl}/search-external`,
      {
        params: searchParameters,
        withCredentials: true,
      },
    );
  }
}
