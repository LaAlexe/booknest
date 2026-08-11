import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminBooksController } from './admin-books.controller';
import { AdminBooksService } from './admin-books.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminBooksController],
  providers: [AdminBooksService],
})
export class AdminBooksModule {}
