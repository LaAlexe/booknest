import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { GoogleBooksService } from './google-books.service';

@Module({
  imports: [HttpModule.register({ timeout: 5000 })],
  providers: [GoogleBooksService],
  exports: [GoogleBooksService],
})
export class GoogleBooksModule {}
