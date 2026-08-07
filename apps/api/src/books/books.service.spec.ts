import { NotFoundException } from '@nestjs/common';
import { BookStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { BooksService, PublicBook } from './books.service';
import { ListBooksQueryDto } from './dto/list-books-query.dto';

describe('BooksService', () => {
  const findMany = jest.fn();
  const count = jest.fn();
  const findFirst = jest.fn();
  const transaction = jest.fn();
  const prisma = {
    book: { findMany, count, findFirst },
    $transaction: transaction,
  } as unknown as PrismaService;
  const service = new BooksService(prisma);
  const book: PublicBook = {
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

  beforeEach(() => {
    jest.clearAllMocks();
    findMany.mockReturnValue(Promise.resolve([]));
    count.mockReturnValue(Promise.resolve(0));
  });

  it('lists books with pagination metadata and excludes archived books', async () => {
    transaction.mockResolvedValue([[book], 1]);

    const result = await service.findAll(new ListBooksQueryDto());

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isArchived: false },
        skip: 0,
        take: 20,
      }),
    );
    expect(result).toEqual({
      data: [book],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
  });

  it('filters by genre slug', async () => {
    transaction.mockResolvedValue([[], 0]);

    await service.findAll(
      Object.assign(new ListBooksQueryDto(), { genre: 'fantasy' }),
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isArchived: false,
          genre: { slug: 'fantasy' },
        },
      }),
    );
  });

  it('searches title and author case-insensitively', async () => {
    transaction.mockResolvedValue([[], 0]);

    await service.findAll(
      Object.assign(new ListBooksQueryDto(), { q: 'tolkien' }),
    );

    expect(findMany).toHaveBeenCalledWith(
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
    transaction.mockResolvedValue([[], 45]);
    const query = Object.assign(new ListBooksQueryDto(), {
      page: 3,
      pageSize: 10,
    });

    const result = await service.findAll(query);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
    expect(result.meta).toEqual({
      page: 3,
      pageSize: 10,
      total: 45,
      totalPages: 5,
    });
  });

  it('returns a non-archived book by id', async () => {
    findFirst.mockResolvedValue(book);

    await expect(service.findOne(book.id)).resolves.toEqual(book);
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: book.id, isArchived: false },
      }),
    );
  });

  it('does not expose an archived or missing book by id', async () => {
    findFirst.mockResolvedValue(null);

    await expect(service.findOne(book.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
