export type BookStatus = 'AVAILABLE' | 'RESERVED' | 'BORROWED';

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  coverUrl: string | null;
  status: BookStatus;
  genre: Genre;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedBooks {
  data: Book[];
  meta: PageMeta;
}

export interface BookQuery {
  locale?: 'en' | 'uk';
  query?: string;
  genre?: string;
  page?: number;
  pageSize?: number;
}


export interface BookCatalog {
  catalogPage: PaginatedBooks;
  availableGenres: Genre[];
}

export interface CatalogFilters {
  searchText: string;
  genreSlug: string;
  pageNumber: number;
}
