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
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBookInput {
  title: string;
  author: string;
  description: string | null;
  coverUrl: string | null;
  genreId: string;
}
