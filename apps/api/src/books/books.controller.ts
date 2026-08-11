import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { BooksService, PaginatedBooks, PublicBook } from './books.service';
import { ListBooksQueryDto } from './dto/list-books-query.dto';
import { ContentLocaleQueryDto } from '../content-localization/content-locale-query.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  findAll(@Query() listBooksQuery: ListBooksQueryDto): Promise<PaginatedBooks> {
    return this.booksService.findAll(listBooksQuery);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) bookId: string,
    @Query() localeQuery: ContentLocaleQueryDto,
  ): Promise<PublicBook> {
    return this.booksService.findOne(bookId, localeQuery.locale);
  }
}
