import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { BooksModule } from './books/books.module';
import { DatabaseModule } from './database/database.module';
import { GenresModule } from './genres/genres.module';
import { HealthController } from './health/health.controller';

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
      }),
    }),
    DatabaseModule,
    BooksModule,
    GenresModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
