export interface ExternalBookSearchResult {
  externalId: string;
  title: string;
  authors: string[];
  description: string | null;
  coverUrl: string | null;
  isbn: string | null;
  publishedDate: string | null;
  language: string | null;
  categories: string[];
}

export interface GoogleBooksResponse {
  items?: GoogleBooksVolume[];
}

export interface GoogleBooksVolume {
  id?: string;
  volumeInfo?: GoogleBooksVolumeInfo;
}

interface GoogleBooksVolumeInfo {
  title?: string;
  authors?: string[];
  description?: string;
  publishedDate?: string;
  language?: string;
  categories?: string[];
  industryIdentifiers?: GoogleBooksIndustryIdentifier[];
  imageLinks?: GoogleBooksImageLinks;
}

export interface GoogleBooksIndustryIdentifier {
  type?: string;
  identifier?: string;
}

export interface GoogleBooksImageLinks {
  large?: string;
  medium?: string;
  small?: string;
  thumbnail?: string;
  smallThumbnail?: string;
}
