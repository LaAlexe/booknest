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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { ContentLocaleQueryDto } from '../content-localization/content-locale-query.dto';
import { GoogleBooksService } from '../integrations/google-books/google-books.service';
import { ExternalBookSearchResult } from '../integrations/google-books/google-books.types';
import { AdminBook, AdminBooksService } from './admin-books.service';
import { CreateAdminBookDto } from './dto/create-admin-book.dto';
import { SearchExternalBooksQueryDto } from './dto/search-external-books-query.dto';
import { UpdateAdminBookDto } from './dto/update-admin-book.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('admin/books')
@UseGuards(AdminAuthGuard)
export class AdminBooksController {
  constructor(
    private readonly adminBooksService: AdminBooksService,
    private readonly googleBooksService: GoogleBooksService,
  ) {}

  @Get()
  findAll(@Query() localeQuery: ContentLocaleQueryDto): Promise<AdminBook[]> {
    return this.adminBooksService.findAll(localeQuery.locale);
  }

  @Get('search-external')
  searchExternalBooks(
    @Query() searchQuery: SearchExternalBooksQueryDto,
  ): Observable<ExternalBookSearchResult[]> {
    return this.googleBooksService.searchBooks(searchQuery.q);
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

  @Post(':bookId/cover')
@UseInterceptors(FileInterceptor('file'))
uploadCover(
  @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({
          maxSize: 5 * 1024 * 1024,
        }),
        new FileTypeValidator({
          fileType: /^image\/(jpeg|png|webp)$/,
        }),
      ],
      fileIsRequired: true,
      exceptionFactory: (error) => new BadRequestException(error),
    }),
  )
  file: Express.Multer.File,
): Promise<AdminBook> {
  return this.adminBooksService.uploadCover(bookId, file);
}

  @Post(':bookId/archive')
  @HttpCode(HttpStatus.OK)
  archive(
    @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
  ): Promise<AdminBook> {
    return this.adminBooksService.archive(bookId);
  }
}
