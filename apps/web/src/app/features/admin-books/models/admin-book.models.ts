import { BookStatus, Genre } from '../../catalog/models/catalog.models';

export interface AdminBook {
  id: string;
  title: string;
  author: string;
  description: string | null;
  coverUrl: string | null;
  status: BookStatus;
  genreId: string;
  genre: Genre;
  translations: {
    en: AdminBookTranslation;
    uk?: AdminBookTranslation;
  };
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBookTranslation {
  title: string;
  author: string;
  description: string | null;
}

export interface AdminBookInput {
  translations: {
    en: AdminBookTranslation;
    uk?: AdminBookTranslation;
  };
  coverUrl: string | null;
  genreId: string;
}
