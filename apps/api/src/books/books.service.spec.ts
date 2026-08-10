import { NotFoundException } from '@nestjs/common';
import { BookStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { BooksService, PublicBook } from './books.service';
import { ListBooksQueryDto } from './dto/list-books-query.dto';

describe('BooksService', () => {
  const findManyBooks = jest.fn();
  const countBooks = jest.fn();
  const findFirstBook = jest.fn();
  const runTransaction = jest.fn();
  let booksService: BooksService;
  const publicBook: PublicBook = {
    id: '6c06bb7b-5294-4a22-b37c-d69214c08062',
    title: 'The Hobbit',
    author: 'J. R. R. Tolkien',
    description: null,
    coverUrl: null,
    status: BookStatus.AVAILABLE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    genre: {
      id: '87de0284-9b75-4395-9bd8-1217e374ef78',
      name: 'Fantasy',
      slug: 'fantasy',
    },
  };

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: PrismaService,
          useValue: {
            book: {
              findMany: findManyBooks,
              count: countBooks,
              findFirst: findFirstBook,
            },
            $transaction: runTransaction,
          },
        },
      ],
    }).compile();
    booksService = testingModule.get(BooksService);
    jest.clearAllMocks();
    findManyBooks.mockResolvedValue([]);
    countBooks.mockResolvedValue(0);
  });

  it('lists books with pagination metadata and excludes archived books', async () => {
    runTransaction.mockResolvedValue([[publicBook], 1]);

    const catalogPage = await booksService.findAll(new ListBooksQueryDto());

    expect(findManyBooks).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isArchived: false },
        skip: 0,
        take: 20,
      }),
    );
    expect(catalogPage).toEqual({
      data: [publicBook],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
  });

  it('filters by genre slug', async () => {
    runTransaction.mockResolvedValue([[], 0]);

    await booksService.findAll(
      Object.assign(new ListBooksQueryDto(), { genre: 'fantasy' }),
    );

    expect(findManyBooks).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isArchived: false,
          genre: { slug: 'fantasy' },
        },
      }),
    );
  });

  it('searches title and author case-insensitively', async () => {
    runTransaction.mockResolvedValue([[], 0]);

    await booksService.findAll(
      Object.assign(new ListBooksQueryDto(), { q: 'tolkien' }),
    );

    expect(findManyBooks).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isArchived: false,
          OR: [
            { title: { contains: 'tolkien', mode: 'insensitive' } },
            { author: { contains: 'tolkien', mode: 'insensitive' } },
          ],
        },
      }),
    );
  });

  it('applies page and page-size offsets', async () => {
    runTransaction.mockResolvedValue([[], 45]);
    const listBooksQuery = Object.assign(new ListBooksQueryDto(), {
      page: 3,
      pageSize: 10,
    });

    const catalogPage = await booksService.findAll(listBooksQuery);

    expect(findManyBooks).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
    expect(catalogPage.meta).toEqual({
      page: 3,
      pageSize: 10,
      total: 45,
      totalPages: 5,
    });
  });

  it('returns a non-archived book by id', async () => {
    findFirstBook.mockResolvedValue(publicBook);

    await expect(booksService.findOne(publicBook.id)).resolves.toEqual(
      publicBook,
    );
    expect(findFirstBook).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: publicBook.id, isArchived: false },
      }),
    );
  });

  it('does not expose an archived or missing book by id', async () => {
    findFirstBook.mockResolvedValue(null);

    await expect(booksService.findOne(publicBook.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
