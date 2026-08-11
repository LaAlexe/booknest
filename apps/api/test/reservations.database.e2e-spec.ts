import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Book, BookStatus, ReservationStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { ReservationsService } from '../src/reservations/reservations.service';

describe('Reservation concurrency (database e2e)', () => {
  let apiApplication: INestApplication<App>;
  let prismaService: PrismaService;
  let reservationsService: ReservationsService;
  let testGenreId: string;

  beforeAll(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    apiApplication = testingModule.createNestApplication();
    apiApplication.setGlobalPrefix('api/v1');
    apiApplication.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await apiApplication.init();
    prismaService = apiApplication.get(PrismaService);
    reservationsService = apiApplication.get(ReservationsService);

    const testGenre = await prismaService.genre.create({
      data: {
        name: `Reservation test ${randomUUID()}`,
        slug: `reservation-test-${randomUUID()}`,
      },
    });
    testGenreId = testGenre.id;
  });

  afterEach(async () => {
    await prismaService.reservation.deleteMany({
      where: { book: { genreId: testGenreId } },
    });
    await prismaService.book.deleteMany({ where: { genreId: testGenreId } });
  });

  afterAll(async () => {
    await prismaService.genre.delete({ where: { id: testGenreId } });
    await apiApplication.close();
  });

  it('creates a reserved reservation and changes the book to RESERVED', async () => {
    const availableBook = await createTestBook();

    const reservationResponse = await request(apiApplication.getHttpServer())
      .post(`/api/v1/books/${availableBook.id}/reservations`)
      .send({
        requesterName: 'Svitlana',
        telegramUsername: '@username',
      })
      .expect(201);

    expect(reservationResponse.body).toMatchObject({
      bookId: availableBook.id,
      requesterName: 'Svitlana',
      telegramUsername: '@username',
      status: ReservationStatus.RESERVED,
      book: { status: BookStatus.RESERVED },
    });
    await expectBookStatus(availableBook.id, BookStatus.RESERVED);
  });

  it('does not reserve an archived book', async () => {
    const archivedBook = await createTestBook(true);

    const reservationResponse = await request(apiApplication.getHttpServer())
      .post(`/api/v1/books/${archivedBook.id}/reservations`)
      .send({
        requesterName: 'Svitlana',
        telegramUsername: '@username',
      })
      .expect(409);

    expect(reservationResponse.body).toMatchObject({
      code: 'BOOK_NOT_AVAILABLE',
    });
    await expectBookStatus(archivedBook.id, BookStatus.AVAILABLE);
  });

  it('rolls back the book claim when reservation insertion fails', async () => {
    const availableBook = await createTestBook();

    await expect(
      reservationsService.create(availableBook.id, {
        requesterName: 'Svitlana',
        telegramUsername: `@${'a'.repeat(40)}`,
      }),
    ).rejects.toThrow();

    await expectBookStatus(availableBook.id, BookStatus.AVAILABLE);
    await expect(
      prismaService.reservation.count({ where: { bookId: availableBook.id } }),
    ).resolves.toBe(0);
  });

  it('allows exactly one concurrent reservation request to succeed', async () => {
    const availableBook = await createTestBook();
    const reservationUrl = `/api/v1/books/${availableBook.id}/reservations`;

    const reservationResponses = await Promise.all([
      request(apiApplication.getHttpServer())
        .post(reservationUrl)
        .send({ requesterName: 'Reader One', telegramUsername: '@reader_one' }),
      request(apiApplication.getHttpServer())
        .post(reservationUrl)
        .send({ requesterName: 'Reader Two', telegramUsername: '@reader_two' }),
    ]);

    const responseStatuses = reservationResponses
      .map((reservationResponse) => reservationResponse.status)
      .sort();
    expect(responseStatuses).toEqual([201, 409]);
    expect(
      reservationResponses.find(
        (reservationResponse) => reservationResponse.status === 409,
      )?.body,
    ).toMatchObject({ code: 'BOOK_NOT_AVAILABLE' });
    await expect(
      prismaService.reservation.count({
        where: {
          bookId: availableBook.id,
          status: {
            in: [ReservationStatus.RESERVED, ReservationStatus.BORROWED],
          },
        },
      }),
    ).resolves.toBe(1);
  });

  function createTestBook(isArchived = false): Promise<Book> {
    return prismaService.book.create({
      data: {
        title: `Reservation test book ${randomUUID()}`,
        author: 'BookNest test',
        genreId: testGenreId,
        isArchived,
      },
    });
  }

  async function expectBookStatus(
    bookId: string,
    expectedStatus: BookStatus,
  ): Promise<void> {
    const storedBook = await prismaService.book.findUniqueOrThrow({
      where: { id: bookId },
    });
    expect(storedBook.status).toBe(expectedStatus);
  }
});
