import { INestApplication, ValidationPipe } from '@nestjs/common';
import { BookStatus, ContentLocale, ReservationStatus } from '@prisma/client';
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
  const claimAvailableBook = jest.fn();
  const createReservation = jest.fn();
  type ReservationTransactionOperation = (transactionClient: {
    $queryRaw: typeof claimAvailableBook;
    reservation: { create: typeof createReservation };
  }) => Promise<unknown>;
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
  const storedPublicBook = {
    id: publicBook.id,
    coverUrl: publicBook.coverUrl,
    status: publicBook.status,
    createdAt: publicBook.createdAt,
    updatedAt: publicBook.updatedAt,
    translations: [
      {
        locale: ContentLocale.en,
        title: publicBook.title,
        author: publicBook.author,
        description: publicBook.description,
      },
    ],
    genre: {
      id: publicBook.genre.id,
      slug: publicBook.genre.slug,
      translations: [{ locale: ContentLocale.en, name: publicBook.genre.name }],
    },
  };
  const publicReservation = {
    id: 'eb3865f0-8ef4-41a4-bc57-7c762806438d',
    bookId: publicBook.id,
    requesterName: 'Svitlana',
    telegramUsername: '@username',
    status: ReservationStatus.RESERVED,
    reservedAt: new Date('2026-08-10T12:00:00.000Z'),
    borrowedAt: null,
    returnedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: new Date('2026-08-10T12:00:00.000Z'),
    updatedAt: new Date('2026-08-10T12:00:00.000Z'),
    book: { status: BookStatus.RESERVED },
  };

  const executeReservationTransaction = (
    transactionOperation: ReservationTransactionOperation,
  ): Promise<unknown> =>
    transactionOperation({
      $queryRaw: claimAvailableBook,
      reservation: { create: createReservation },
    });

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
        reservation: { create: createReservation },
        $queryRaw: claimAvailableBook,
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
    runTransaction.mockResolvedValue([[storedPublicBook], 1]);

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
    findBook.mockResolvedValue(storedPublicBook);

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
    findManyGenres.mockResolvedValue([
      {
        id: publicBook.genre.id,
        slug: publicBook.genre.slug,
        translations: [
          { locale: ContentLocale.en, name: publicBook.genre.name },
        ],
      },
    ]);

    return request(apiApplication.getHttpServer())
      .get('/api/v1/genres')
      .expect(200)
      .expect([publicBook.genre]);
  });

  it('/api/v1/books/:bookId/reservations (POST)', () => {
    runTransaction.mockImplementation(executeReservationTransaction);
    claimAvailableBook.mockResolvedValue([{ id: publicBook.id }]);
    createReservation.mockResolvedValue(publicReservation);

    return request(apiApplication.getHttpServer())
      .post(`/api/v1/books/${publicBook.id}/reservations`)
      .send({
        requesterName: ' Svitlana ',
        telegramUsername: 'USERNAME',
      })
      .expect(201)
      .expect({
        ...publicReservation,
        reservedAt: publicReservation.reservedAt.toISOString(),
        createdAt: publicReservation.createdAt.toISOString(),
        updatedAt: publicReservation.updatedAt.toISOString(),
      });
  });

  it('rejects invalid reservation input and book identifiers', async () => {
    await request(apiApplication.getHttpServer())
      .post(`/api/v1/books/${publicBook.id}/reservations`)
      .send({ requesterName: ' ', telegramUsername: '@username' })
      .expect(400);
    await request(apiApplication.getHttpServer())
      .post(`/api/v1/books/${publicBook.id}/reservations`)
      .send({ requesterName: 'Svitlana', telegramUsername: '@bad-name' })
      .expect(400);
    await request(apiApplication.getHttpServer())
      .post('/api/v1/books/not-a-uuid/reservations')
      .send({ requesterName: 'Svitlana', telegramUsername: '@username' })
      .expect(400);
  });

  it('returns BOOK_NOT_AVAILABLE when a book cannot be claimed', () => {
    runTransaction.mockImplementation(executeReservationTransaction);
    claimAvailableBook.mockResolvedValue([]);

    return request(apiApplication.getHttpServer())
      .post(`/api/v1/books/${publicBook.id}/reservations`)
      .send({ requesterName: 'Svitlana', telegramUsername: '@username' })
      .expect(409)
      .expect(/BOOK_NOT_AVAILABLE/);
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
