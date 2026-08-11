import { Injectable, NotFoundException } from '@nestjs/common';
import { BookStatus, ContentLocale, Prisma } from '@prisma/client';
import {
  requestedContentLocales,
  selectContentTranslation,
} from '../content-localization/select-content-translation';
import { PrismaService } from '../database/prisma.service';
import { ListBooksQueryDto } from './dto/list-books-query.dto';

export interface PublicGenre {
  id: string;
  name: string;
  slug: string;
}

export interface PublicBook {
  id: string;
  title: string;
  author: string;
  description: string | null;
  coverUrl: string | null;
  status: BookStatus;
  createdAt: Date;
  updatedAt: Date;
  genre: PublicGenre;
}

export interface PaginatedBooks {
  data: PublicBook[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class BooksService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(listBooksQuery: ListBooksQueryDto): Promise<PaginatedBooks> {
    const bookFilters = this.buildBookFilters(listBooksQuery);
    const booksToSkip = (listBooksQuery.page - 1) * listBooksQuery.pageSize;
    const contentLocales = requestedContentLocales(listBooksQuery.locale);
    const [books, totalBooks] = await this.prismaService.$transaction([
      this.prismaService.book.findMany({
        where: bookFilters,
        select: this.localizedBookSelect(contentLocales),
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: booksToSkip,
        take: listBooksQuery.pageSize,
      }),
      this.prismaService.book.count({ where: bookFilters }),
    ]);

    return {
      data: books.map((book) => this.toPublicBook(book, listBooksQuery.locale)),
      meta: {
        page: listBooksQuery.page,
        pageSize: listBooksQuery.pageSize,
        total: totalBooks,
        totalPages: Math.ceil(totalBooks / listBooksQuery.pageSize),
      },
    };
  }

  async findOne(
    bookId: string,
    locale: ContentLocale = ContentLocale.en,
  ): Promise<PublicBook> {
    const book = await this.prismaService.book.findFirst({
      where: { id: bookId, isArchived: false },
      select: this.localizedBookSelect(requestedContentLocales(locale)),
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return this.toPublicBook(book, locale);
  }

  private buildBookFilters(query: ListBooksQueryDto): Prisma.BookWhereInput {
    return {
      isArchived: false,
      ...(query.genre ? { genre: { slug: query.genre } } : {}),
      ...(query.q ? this.localizedSearchFilter(query.q, query.locale) : {}),
    };
  }

  private localizedSearchFilter(
    searchQuery: string,
    locale: ContentLocale,
  ): Prisma.BookWhereInput {
    const translationMatches: Prisma.BookTranslationWhereInput = {
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { author: { contains: searchQuery, mode: 'insensitive' } },
      ],
    };
    if (locale === ContentLocale.en) {
      return {
        translations: {
          some: { locale: ContentLocale.en, ...translationMatches },
        },
      };
    }
    return {
      OR: [
        {
          translations: {
            some: { locale: ContentLocale.uk, ...translationMatches },
          },
        },
        {
          AND: [
            { translations: { none: { locale: ContentLocale.uk } } },
            {
              translations: {
                some: { locale: ContentLocale.en, ...translationMatches },
              },
            },
          ],
        },
      ],
    };
  }

  private localizedBookSelect(contentLocales: ContentLocale[]) {
    return {
      id: true,
      coverUrl: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      translations: {
        where: { locale: { in: contentLocales } },
        select: { locale: true, title: true, author: true, description: true },
      },
      genre: {
        select: {
          id: true,
          slug: true,
          translations: {
            where: { locale: { in: contentLocales } },
            select: { locale: true, name: true },
          },
        },
      },
    } satisfies Prisma.BookSelect;
  }

  private toPublicBook(
    book: Prisma.BookGetPayload<{
      select: ReturnType<BooksService['localizedBookSelect']>;
    }>,
    locale: ContentLocale,
  ): PublicBook {
    const bookTranslation = selectContentTranslation(book.translations, locale);
    const genreTranslation = selectContentTranslation(
      book.genre.translations,
      locale,
    );
    return {
      id: book.id,
      title: bookTranslation.title,
      author: bookTranslation.author,
      description: bookTranslation.description,
      coverUrl: book.coverUrl,
      status: book.status,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      genre: {
        id: book.genre.id,
        slug: book.genre.slug,
        name: genreTranslation.name,
      },
    };
  }
}
