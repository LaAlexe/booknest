import { ConflictException } from '@nestjs/common';
import { BookStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { AdminBooksService } from './admin-books.service';

describe('AdminBooksService', () => {
  const genreId = '87de0284-9b75-4395-9bd8-1217e374ef78';
  const availableBook = {
    id: '6c06bb7b-5294-4a22-b37c-d69214c08062',
    title: 'The Hobbit',
    author: 'J. R. R. Tolkien',
    description: null,
    coverUrl: null,
    status: BookStatus.AVAILABLE,
    genreId,
    isArchived: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    genre: { id: genreId, name: 'Fantasy', slug: 'fantasy' },
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

  it('creates an available book with validated catalog fields', async () => {
    countGenres.mockResolvedValue(1);
    createBook.mockResolvedValue(availableBook);
    const createBookInput = {
      title: availableBook.title,
      author: availableBook.author,
      description: null,
      coverUrl: null,
      genreId,
    };

    await expect(adminBooksService.create(createBookInput)).resolves.toEqual(
      availableBook,
    );
    expect(createBook).toHaveBeenCalledWith(
      expect.objectContaining({ data: createBookInput }),
    );
  });

  it('updates catalog fields without changing status', async () => {
    findBook.mockResolvedValue(availableBook);
    updateBook.mockResolvedValue({ ...availableBook, title: 'Updated title' });

    await adminBooksService.update(availableBook.id, {
      title: 'Updated title',
    });

    expect(updateBook).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: 'Updated title' },
      }),
    );
  });

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
