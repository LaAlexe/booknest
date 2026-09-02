import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookStatus, ContentLocale, Prisma } from '@prisma/client';
import { selectContentTranslation } from '../content-localization/select-content-translation';
import { PrismaService } from '../database/prisma.service';
import { CreateAdminBookDto } from './dto/create-admin-book.dto';
import { UpdateAdminBookDto } from './dto/update-admin-book.dto';
import { BookTranslationDto } from './dto/book-translations.dto';
import { S3Service } from '../s3/s3.service';
import { randomUUID } from 'crypto';

const adminBookSelect = Prisma.validator<Prisma.BookSelect>()({
  id: true,
  coverUrl: true,
  coverKey: true,
  status: true,
  genreId: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
  translations: {
    select: { locale: true, title: true, author: true, description: true },
  },
  genre: {
    select: {
      id: true,
      slug: true,
      translations: {
        select: { locale: true, name: true },
      },
    },
  },
});

type StoredAdminBook = Prisma.BookGetPayload<{
  select: typeof adminBookSelect;
}>;

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

@Injectable()
export class AdminBooksService {
  constructor(
  private readonly prismaService: PrismaService,
  private readonly s3Service: S3Service,
) {}

  async findAll(
    locale: ContentLocale = ContentLocale.en,
  ): Promise<AdminBook[]> {
    const books = await this.prismaService.book.findMany({
      select: adminBookSelect,
      orderBy: [{ isArchived: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    });
    return Promise.all(books.map((book) => this.toAdminBook(book, locale)),
);
  }

  async findOne(
    bookId: string,
    locale: ContentLocale = ContentLocale.en,
  ): Promise<AdminBook> {
    const book = await this.prismaService.book.findUnique({
      where: { id: bookId },
      select: adminBookSelect,
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return this.toAdminBook(book, locale);
  }

  async create(createBook: CreateAdminBookDto): Promise<AdminBook> {
    await this.ensureGenreExists(createBook.genreId);
    const book = await this.prismaService.book.create({
      data: {
        coverUrl: createBook.coverUrl,
        genreId: createBook.genreId,
        translations: {
          create: this.translationCreateInputs(createBook.translations),
        },
      },
      select: adminBookSelect,
    });
    return this.toAdminBook(book);
  }

  async update(
    bookId: string,
    updateBook: UpdateAdminBookDto,
  ): Promise<AdminBook> {
    if (Object.keys(updateBook).length === 0) {
      throw new BadRequestException('At least one book field is required');
    }
    if (updateBook.genreId) {
      await this.ensureGenreExists(updateBook.genreId);
    }
    await this.findOne(bookId);
    const book = await this.prismaService.book.update({
      where: { id: bookId },
      data: {
        coverUrl: updateBook.coverUrl,
        genreId: updateBook.genreId,
        translations: updateBook.translations
          ? {
              upsert: this.translationUpsertInputs(
                bookId,
                updateBook.translations,
              ),
            }
          : undefined,
      },
      select: adminBookSelect,
    });
    return this.toAdminBook(book);
  }
  
  async uploadCover(
  bookId: string,
  file: Express.Multer.File,
): Promise<AdminBook> {
  await this.findOne(bookId);

  const extension = this.getCoverExtension(file.mimetype);
  const coverKey = `books/${bookId}/${randomUUID()}.${extension}`;

  await this.s3Service.uploadBookCover(
    coverKey,
    file.buffer,
    file.mimetype,
  );

  const book = await this.prismaService.book.update({
    where: { id: bookId },
    data: {
      coverKey,
      coverUrl: null,
    },
    select: adminBookSelect,
  });

  return this.toAdminBook(book);
}

  async archive(bookId: string): Promise<AdminBook> {
    const archiveResult = await this.prismaService.book.updateMany({
      where: {
        id: bookId,
        status: BookStatus.AVAILABLE,
        isArchived: false,
      },
      data: { isArchived: true },
    });
    if (archiveResult.count === 1) {
      return this.findOne(bookId);
    }
    const book = await this.findOne(bookId);
    if (book.status !== BookStatus.AVAILABLE) {
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        code: 'BOOK_NOT_ARCHIVABLE',
        message: 'Reserved or borrowed books cannot be archived',
      });
    }
    return book;
  }

  private translationCreateInputs(translations: {
    en: BookTranslationDto;
    uk?: BookTranslationDto;
  }): Prisma.BookTranslationCreateWithoutBookInput[] {
    return [
      { locale: ContentLocale.en, ...translations.en },
      ...(translations.uk
        ? [{ locale: ContentLocale.uk, ...translations.uk }]
        : []),
    ];
  }

  private translationUpsertInputs(
    bookId: string,
    translations: {
      en?: BookTranslationDto;
      uk?: BookTranslationDto;
    },
  ): Prisma.BookTranslationUpsertWithWhereUniqueWithoutBookInput[] {
    return [
      ...(translations.en
        ? [
            this.translationUpsertInput(
              bookId,
              ContentLocale.en,
              translations.en,
            ),
          ]
        : []),
      ...(translations.uk
        ? [
            this.translationUpsertInput(
              bookId,
              ContentLocale.uk,
              translations.uk,
            ),
          ]
        : []),
    ];
  }

  private translationUpsertInput(
    bookId: string,
    locale: ContentLocale,
    translation: BookTranslationDto,
  ): Prisma.BookTranslationUpsertWithWhereUniqueWithoutBookInput {
    return {
      where: { bookId_locale: { bookId, locale } },
      create: { locale, ...translation },
      update: translation,
    };
  }

  private async toAdminBook(
  book: StoredAdminBook,
  locale: ContentLocale = ContentLocale.en,
): Promise<AdminBook> {
    const englishTranslation = selectContentTranslation(
      book.translations,
      ContentLocale.en,
    );
    const ukrainianTranslation = book.translations.find(
      (translation) => translation.locale === ContentLocale.uk,
    );
    const effectiveTranslation = selectContentTranslation(
      book.translations,
      locale,
    );
    const effectiveGenre = selectContentTranslation(
      book.genre.translations,
      locale,
    );

    const coverUrl = book.coverKey
  ? await this.s3Service.getBookCoverUrl(book.coverKey)
  : book.coverUrl;
    return {
      id: book.id,
      title: effectiveTranslation.title,
      author: effectiveTranslation.author,
      description: effectiveTranslation.description,
      coverUrl: coverUrl,
      status: book.status,
      genreId: book.genreId,
      genre: {
        id: book.genre.id,
        slug: book.genre.slug,
        name: effectiveGenre.name,
      },
      translations: {
        en: this.toAdminTranslation(englishTranslation),
        ...(ukrainianTranslation
          ? { uk: this.toAdminTranslation(ukrainianTranslation) }
          : {}),
      },
      isArchived: book.isArchived,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    };
  }

  private toAdminTranslation(translation: {
    title: string;
    author: string;
    description: string | null;
  }): AdminBookTranslation {
    return {
      title: translation.title,
      author: translation.author,
      description: translation.description,
    };
  }

  private async ensureGenreExists(genreId: string): Promise<void> {
    const genreExists = await this.prismaService.genre.count({
      where: { id: genreId },
    });
    if (genreExists === 0) {
      throw new BadRequestException('Genre does not exist');
    }
  }

  private getCoverExtension(contentType: string): string {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      throw new BadRequestException('Unsupported cover image type');
  }
}
}
