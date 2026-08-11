import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminBook, AdminBookInput } from '../models/admin-book.models';

@Injectable({ providedIn: 'root' })
export class AdminBooksApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = '/api/v1/admin/books';

  getBooks(): Observable<AdminBook[]> {
    return this.httpClient.get<AdminBook[]>(this.baseUrl, {
      withCredentials: true,
    });
  }

  getBook(bookId: string): Observable<AdminBook> {
    return this.httpClient.get<AdminBook>(`${this.baseUrl}/${bookId}`, {
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
}
