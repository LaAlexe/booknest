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
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListBooksQueryDto): Promise<PaginatedBooks> {
    const where: Prisma.BookWhereInput = {
      isArchived: false,
      ...(query.genre ? { genre: { slug: query.genre } } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { author: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const skip = (query.page - 1) * query.pageSize;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        select: publicBookSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip,
        take: query.pageSize,
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async findOne(id: string): Promise<PublicBook> {
    const book = await this.prisma.book.findFirst({
      where: { id, isArchived: false },
      select: publicBookSelect,
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }
}
