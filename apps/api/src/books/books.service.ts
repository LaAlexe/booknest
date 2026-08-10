import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ListBooksQueryDto } from './dto/list-books-query.dto';

const publicBookSelect = Prisma.validator<Prisma.BookSelect>()({
  id: true,
  title: true,
  author: true,
  description: true,
  coverUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  genre: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
});

export type PublicBook = Prisma.BookGetPayload<{
  select: typeof publicBookSelect;
}>;

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
    const bookFilters: Prisma.BookWhereInput = {
      isArchived: false,
      ...(listBooksQuery.genre
        ? { genre: { slug: listBooksQuery.genre } }
        : {}),
      ...(listBooksQuery.q
        ? {
            OR: [
              {
                title: { contains: listBooksQuery.q, mode: 'insensitive' },
              },
              {
                author: { contains: listBooksQuery.q, mode: 'insensitive' },
              },
            ],
          }
        : {}),
    };
    const booksToSkip = (listBooksQuery.page - 1) * listBooksQuery.pageSize;

    const [books, totalBooks] = await this.prismaService.$transaction([
      this.prismaService.book.findMany({
        where: bookFilters,
        select: publicBookSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: booksToSkip,
        take: listBooksQuery.pageSize,
      }),
      this.prismaService.book.count({ where: bookFilters }),
    ]);

    return {
      data: books,
      meta: {
        page: listBooksQuery.page,
        pageSize: listBooksQuery.pageSize,
        total: totalBooks,
        totalPages: Math.ceil(totalBooks / listBooksQuery.pageSize),
      },
    };
  }

  async findOne(bookId: string): Promise<PublicBook> {
    const book = await this.prismaService.book.findFirst({
      where: { id: bookId, isArchived: false },
      select: publicBookSelect,
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }
}
