import { Module } from '@nestjs/common';

import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { GoogleBooksModule } from '../integrations/google-books/google-books.module';
import { S3Module } from '../s3/s3.module';

import { AdminBooksController } from './admin-books.controller';
import { AdminBooksService } from './admin-books.service';

@Module({
  imports: [AdminAuthModule, GoogleBooksModule, S3Module],
  controllers: [AdminBooksController],
  providers: [AdminBooksService],
})
export class AdminBooksModule {}
