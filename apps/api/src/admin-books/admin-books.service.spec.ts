import { ConflictException } from '@nestjs/common';
import { BookStatus, ContentLocale } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { S3Service } from '../s3/s3.service';
import { AdminBooksService } from './admin-books.service';

describe('AdminBooksService', () => {
  const genreId = '87de0284-9b75-4395-9bd8-1217e374ef78';
  const availableBook = {
    id: '6c06bb7b-5294-4a22-b37c-d69214c08062',
    coverKey: null,
    coverUrl: null,
    status: BookStatus.AVAILABLE,
    genreId,
    isArchived: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    translations: [
      {
        locale: ContentLocale.en,
        title: 'The Hobbit',
        author: 'J. R. R. Tolkien',
        description: null,
      },
      {
        locale: ContentLocale.uk,
        title: 'Гобіт',
        author: 'Дж. Р. Р. Толкін',
        description: null,
      },
    ],
    genre: {
      id: genreId,
      slug: 'fantasy',
      translations: [{ locale: ContentLocale.en, name: 'Fantasy' }],
    },
  };
  const findBooks = jest.fn((...methodArguments: unknown[]): Promise<unknown> =>
    Promise.resolve(methodArguments),
  );
  const findBook = jest.fn((...methodArguments: unknown[]): Promise<unknown> =>
    Promise.resolve(methodArguments),
  );
  const createBook = jest.fn(
    (...methodArguments: unknown[]): Promise<unknown> =>
      Promise.resolve(methodArguments),
  );
  const updateBook = jest.fn(
    (...methodArguments: unknown[]): Promise<unknown> =>
      Promise.resolve(methodArguments),
  );
  const updateBooks = jest.fn(
    (...methodArguments: unknown[]): Promise<unknown> =>
      Promise.resolve(methodArguments),
  );
  const countGenres = jest.fn(
    (...methodArguments: unknown[]): Promise<unknown> =>
      Promise.resolve(methodArguments),
  );
  const uploadBookCover = jest.fn(() => Promise.resolve());
  const deleteBookCover = jest.fn(() => Promise.resolve());
  const getBookCoverUrl = jest.fn((coverKey: string) =>
    Promise.resolve(`https://book-covers.example/${coverKey}`),
  );
  let adminBooksService: AdminBooksService;

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        AdminBooksService,
        {
          provide: PrismaService,
          useValue: {
            book: {
              findMany: findBooks,
              findUnique: findBook,
              create: createBook,
              update: updateBook,
              updateMany: updateBooks,
            },
            genre: { count: countGenres },
          },
        },
        {
          provide: S3Service,
          useValue: {
            uploadBookCover,
            deleteBookCover,
            getBookCoverUrl,
          },
        },
      ],
    }).compile();
    adminBooksService = testingModule.get(AdminBooksService);
    jest.clearAllMocks();
  });

  it('lists all books without excluding archived records', async () => {
    findBooks.mockResolvedValue([
      availableBook,
      { ...availableBook, id: 'archived-book', isArchived: true },
    ]);

    await expect(adminBooksService.findAll()).resolves.toHaveLength(2);
    const findManyArguments = findBooks.mock.calls[0]?.[0] as {
      where?: unknown;
    };
    expect(findManyArguments.where).toBeUndefined();
  });

  it('creates an English-only available book', async () => {
    countGenres.mockResolvedValue(1);
    createBook.mockResolvedValue(availableBook);

    await adminBooksService.create({
      translations: {
        en: {
          title: 'The Hobbit',
          author: 'J. R. R. Tolkien',
          description: null,
        },
      },
      coverUrl: null,
      genreId,
    });

    const createArguments = createBook.mock.calls[0]?.[0] as {
      data: { translations: { create: Array<{ locale: ContentLocale }> } };
    };
    expect(createArguments.data.translations.create).toHaveLength(1);
    expect(createArguments.data.translations.create[0]?.locale).toBe(
      ContentLocale.en,
    );
  });

  it('creates a book with independent English and Ukrainian content', async () => {
    countGenres.mockResolvedValue(1);
    createBook.mockResolvedValue(availableBook);
    const createBookInput = {
      translations: {
        en: {
          title: 'The Hobbit',
          author: 'J. R. R. Tolkien',
          description: null,
        },
        uk: {
          title: 'Гобіт',
          author: 'Дж. Р. Р. Толкін',
          description: null,
        },
      },
      coverUrl: null,
      genreId,
    };

    await expect(adminBooksService.create(createBookInput)).resolves.toEqual(
      expect.objectContaining({ title: 'The Hobbit' }),
    );
    const createArguments = createBook.mock.calls[0]?.[0] as {
      data: {
        genreId: string;
        translations: {
          create: Array<{ locale: ContentLocale; title: string }>;
        };
      };
    };
    expect(createArguments.data.genreId).toBe(genreId);
    expect(createArguments.data.translations.create).toEqual([
      expect.objectContaining({
        locale: ContentLocale.en,
        title: 'The Hobbit',
      }),
      expect.objectContaining({ locale: ContentLocale.uk, title: 'Гобіт' }),
    ]);
  });

  it('returns both translations in admin book details', async () => {
    findBook.mockResolvedValue(availableBook);

    const bookDetails = await adminBooksService.findOne(availableBook.id);

    expect(bookDetails.translations.en.title).toBe('The Hobbit');
    expect(bookDetails.translations.uk?.title).toBe('Гобіт');
  });

  it('uses requested localized content in admin read responses', async () => {
    findBook.mockResolvedValue({
      ...availableBook,
      genre: {
        ...availableBook.genre,
        translations: [
          ...availableBook.genre.translations,
          { locale: ContentLocale.uk, name: 'Фентезі' },
        ],
      },
    });

    await expect(
      adminBooksService.findOne(availableBook.id, ContentLocale.uk),
    ).resolves.toMatchObject({ title: 'Гобіт', genre: { name: 'Фентезі' } });
  });

  it('updates catalog fields without changing status', async () => {
    findBook.mockResolvedValue(availableBook);
    updateBook.mockResolvedValue({
      ...availableBook,
      translations: [
        { ...availableBook.translations[0], title: 'Updated title' },
      ],
    });

    await adminBooksService.update(availableBook.id, {
      translations: {
        en: { title: 'Updated title', author: 'Author', description: null },
      },
    });

    const updateArguments = updateBook.mock.calls[0]?.[0] as {
      data: { translations: unknown };
    };
    expect(updateArguments.data.translations).toBeDefined();
  });

  it.each([
    ['adds', 'Гобіт'],
    ['edits', 'Гобіт: оновлене видання'],
  ])(
    '%s a Ukrainian translation through the locale upsert',
    async (_actionDescription, ukrainianTitle) => {
      findBook.mockResolvedValue(availableBook);
      updateBook.mockResolvedValue(availableBook);

      await adminBooksService.update(availableBook.id, {
        translations: {
          uk: {
            title: ukrainianTitle,
            author: 'Дж. Р. Р. Толкін',
            description: null,
          },
        },
      });

      const updateArguments = updateBook.mock.calls[0]?.[0] as {
        data: {
          translations: {
            upsert: Array<{
              where: {
                bookId_locale: { bookId: string; locale: ContentLocale };
              };
              create: { title: string };
              update: { title: string };
            }>;
          };
        };
      };
      const ukrainianUpsert = updateArguments.data.translations.upsert[0];
      expect(ukrainianUpsert?.where.bookId_locale).toEqual({
        bookId: availableBook.id,
        locale: ContentLocale.uk,
      });
      expect(ukrainianUpsert?.create.title).toBe(ukrainianTitle);
      expect(ukrainianUpsert?.update.title).toBe(ukrainianTitle);
    },
  );

  it('archives an available book without deleting it', async () => {
    updateBooks.mockResolvedValue({ count: 1 });
    findBook.mockResolvedValue({ ...availableBook, isArchived: true });

    await expect(
      adminBooksService.archive(availableBook.id),
    ).resolves.toMatchObject({
      isArchived: true,
    });
    const archiveArguments = updateBooks.mock.calls[0]?.[0] as {
      where: { status: BookStatus };
      data: { isArchived: boolean };
    };
    expect(archiveArguments.where.status).toBe(BookStatus.AVAILABLE);
    expect(archiveArguments.data).toEqual({ isArchived: true });
  });

  it.each([BookStatus.RESERVED, BookStatus.BORROWED])(
    'rejects archiving a %s book',
    async (bookStatus) => {
      updateBooks.mockResolvedValue({ count: 0 });
      findBook.mockResolvedValue({ ...availableBook, status: bookStatus });

      await expect(
        adminBooksService.archive(availableBook.id),
      ).rejects.toBeInstanceOf(ConflictException);
    },
  );
});
