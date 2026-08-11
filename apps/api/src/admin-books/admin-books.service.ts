import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateAdminBookDto } from './dto/create-admin-book.dto';
import { UpdateAdminBookDto } from './dto/update-admin-book.dto';

const adminBookSelect = Prisma.validator<Prisma.BookSelect>()({
  id: true,
  title: true,
  author: true,
  description: true,
  coverUrl: true,
  status: true,
  genreId: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
  genre: { select: { id: true, name: true, slug: true } },
});

export type AdminBook = Prisma.BookGetPayload<{
  select: typeof adminBookSelect;
}>;

@Injectable()
export class AdminBooksService {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(): Promise<AdminBook[]> {
    return this.prismaService.book.findMany({
      select: adminBookSelect,
      orderBy: [{ isArchived: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    });
  }

  async findOne(bookId: string): Promise<AdminBook> {
    const book = await this.prismaService.book.findUnique({
      where: { id: bookId },
      select: adminBookSelect,
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  async create(createBook: CreateAdminBookDto): Promise<AdminBook> {
    await this.ensureGenreExists(createBook.genreId);
    return this.prismaService.book.create({
      data: createBook,
      select: adminBookSelect,
    });
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
    return this.prismaService.book.update({
      where: { id: bookId },
      data: updateBook,
      select: adminBookSelect,
    });
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

  private async ensureGenreExists(genreId: string): Promise<void> {
    const genreExists = await this.prismaService.genre.count({
      where: { id: genreId },
    });
    if (genreExists === 0) {
      throw new BadRequestException('Genre does not exist');
    }
  }
}
