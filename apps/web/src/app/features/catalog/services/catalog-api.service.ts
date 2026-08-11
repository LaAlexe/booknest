import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SupportedLanguage } from '../../../shared/services/language.service';
import {
  Book,
  BookQuery,
  Genre,
  PaginatedBooks,
} from '../models/catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  getBooks(bookQuery: BookQuery = {}): Observable<PaginatedBooks> {
    let queryParameters = new HttpParams();
    for (const [parameterName, parameterValue] of Object.entries(bookQuery)) {
      if (parameterValue !== undefined && parameterValue !== '') {
        queryParameters = queryParameters.set(parameterName, parameterValue);
      }
    }
    return this.httpClient.get<PaginatedBooks>(`${this.baseUrl}/books`, {
      params: queryParameters,
    });
  }

  getBook(bookId: string, locale: SupportedLanguage = 'en'): Observable<Book> {
    return this.httpClient.get<Book>(`${this.baseUrl}/books/${bookId}`, {
      params: { locale },
    });
  }

  getGenres(locale: SupportedLanguage = 'en'): Observable<Genre[]> {
    return this.httpClient.get<Genre[]>(`${this.baseUrl}/genres`, {
      params: { locale },
    });
  }
}
