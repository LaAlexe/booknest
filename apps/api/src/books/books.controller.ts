import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { BooksService, PaginatedBooks, PublicBook } from './books.service';
import { ListBooksQueryDto } from './dto/list-books-query.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  findAll(@Query() query: ListBooksQueryDto): Promise<PaginatedBooks> {
    return this.booksService.findAll(query);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<PublicBook> {
    return this.booksService.findOne(id);
  }
}
