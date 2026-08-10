import { INestApplication, ValidationPipe } from '@nestjs/common';
import { BookStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';

describe('AppController (e2e)', () => {
  let apiApplication: INestApplication<App>;
  const findManyBooks = jest.fn();
  const findBook = jest.fn();
  const countBooks = jest.fn();
  const findManyGenres = jest.fn();
  const runTransaction = jest.fn();
  const publicBook = {
    id: '6c06bb7b-5294-4a22-b37c-d69214c08062',
    title: 'The Hobbit',
    author: 'J. R. R. Tolkien',
    description: null,
    coverUrl: null,
    status: BookStatus.AVAILABLE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    genre: {
      id: '87de0284-9b75-4395-9bd8-1217e374ef78',
      name: 'Fantasy',
      slug: 'fantasy',
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        book: {
          findMany: findManyBooks,
          findFirst: findBook,
          count: countBooks,
        },
        genre: { findMany: findManyGenres },
        $transaction: runTransaction,
      })
      .compile();

    apiApplication = moduleFixture.createNestApplication();
    apiApplication.setGlobalPrefix('api/v1');
    apiApplication.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await apiApplication.init();

    jest.clearAllMocks();
    findManyBooks.mockResolvedValue([]);
    countBooks.mockResolvedValue(0);
    runTransaction.mockResolvedValue([[], 0]);
    findManyGenres.mockResolvedValue([]);
  });

  it('/api/v1/health (GET)', () => {
    return request(apiApplication.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/api/v1/books (GET)', () => {
    runTransaction.mockResolvedValue([[publicBook], 1]);

    return request(apiApplication.getHttpServer())
      .get('/api/v1/books?page=1&pageSize=10&genre=fantasy&q=hobbit')
      .expect(200)
      .expect({
        data: [
          {
            ...publicBook,
            createdAt: publicBook.createdAt.toISOString(),
            updatedAt: publicBook.updatedAt.toISOString(),
          },
        ],
        meta: {
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        },
      });
  });

  it('/api/v1/books/:id (GET)', () => {
    findBook.mockResolvedValue(publicBook);

    return request(apiApplication.getHttpServer())
      .get(`/api/v1/books/${publicBook.id}`)
      .expect(200)
      .expect({
        ...publicBook,
        createdAt: publicBook.createdAt.toISOString(),
        updatedAt: publicBook.updatedAt.toISOString(),
      });
  });

  it('/api/v1/genres (GET)', () => {
    findManyGenres.mockResolvedValue([publicBook.genre]);

    return request(apiApplication.getHttpServer())
      .get('/api/v1/genres')
      .expect(200)
      .expect([publicBook.genre]);
  });

  it('rejects invalid pagination and route identifiers', async () => {
    await request(apiApplication.getHttpServer())
      .get('/api/v1/books?page=0')
      .expect(400);
    await request(apiApplication.getHttpServer())
      .get('/api/v1/books/not-a-uuid')
      .expect(400);
  });

  afterEach(async () => {
    await apiApplication.close();
  });
});
