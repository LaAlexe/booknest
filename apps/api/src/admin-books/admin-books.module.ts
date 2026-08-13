import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { GoogleBooksModule } from '../integrations/google-books/google-books.module';
import { AdminBooksController } from './admin-books.controller';
import { AdminBooksService } from './admin-books.service';

@Module({
  imports: [AdminAuthModule, GoogleBooksModule],
  controllers: [AdminBooksController],
  providers: [AdminBooksService],
})
export class AdminBooksModule {}
