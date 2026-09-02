import { BookStatus } from '@prisma/client';

export interface AdminBookTranslation {
  title: string;
  author: string;
  description: string | null;
}

export interface AdminBook {
  id: string;
  title: string;
  author: string;
  description: string | null;
  coverUrl: string | null;
  status: BookStatus;
  genreId: string;
  genre: { id: string; name: string; slug: string };
  translations: {
    en: AdminBookTranslation;
    uk?: AdminBookTranslation;
  };
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
