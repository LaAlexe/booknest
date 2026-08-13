import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminBooksModule } from './admin-books/admin-books.module';
import { AdminReservationsModule } from './admin-reservations/admin-reservations.module';
import { BooksModule } from './books/books.module';
import { DatabaseModule } from './database/database.module';
import { GenresModule } from './genres/genres.module';
import { HealthController } from './health/health.controller';
import { ReservationsModule } from './reservations/reservations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../../.env'],
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string()
          .uri({ scheme: ['postgresql'] })
          .required(),
        PORT: Joi.number().port().default(3000),
        ADMIN_SESSION_TTL_HOURS: Joi.number().integer().min(1).default(12),
        GOOGLE_BOOKS_API_KEY: Joi.string().allow('').optional(),
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
      }),
    }),
    DatabaseModule,
    BooksModule,
    GenresModule,
    ReservationsModule,
    AdminAuthModule,
    AdminBooksModule,
    AdminReservationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
