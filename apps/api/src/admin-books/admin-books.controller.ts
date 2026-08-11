import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { ContentLocaleQueryDto } from '../content-localization/content-locale-query.dto';
import { AdminBook, AdminBooksService } from './admin-books.service';
import { CreateAdminBookDto } from './dto/create-admin-book.dto';
import { UpdateAdminBookDto } from './dto/update-admin-book.dto';

@Controller('admin/books')
@UseGuards(AdminAuthGuard)
export class AdminBooksController {
  constructor(private readonly adminBooksService: AdminBooksService) {}

  @Get()
  findAll(@Query() localeQuery: ContentLocaleQueryDto): Promise<AdminBook[]> {
    return this.adminBooksService.findAll(localeQuery.locale);
  }

  @Get(':bookId')
  findOne(
    @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
    @Query() localeQuery: ContentLocaleQueryDto,
  ): Promise<AdminBook> {
    return this.adminBooksService.findOne(bookId, localeQuery.locale);
  }

  @Post()
  create(@Body() createBook: CreateAdminBookDto): Promise<AdminBook> {
    return this.adminBooksService.create(createBook);
  }

  @Patch(':bookId')
  update(
    @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
    @Body() updateBook: UpdateAdminBookDto,
  ): Promise<AdminBook> {
    return this.adminBooksService.update(bookId, updateBook);
  }

  @Post(':bookId/archive')
  @HttpCode(HttpStatus.OK)
  archive(
    @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
  ): Promise<AdminBook> {
    return this.adminBooksService.archive(bookId);
  }
}
