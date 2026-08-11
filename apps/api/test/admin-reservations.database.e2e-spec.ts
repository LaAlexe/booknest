import { INestApplication, ValidationPipe } from '@nestjs/common';
import { BookStatus, ReservationStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import argon2 from 'argon2';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Admin reservations (database e2e)', () => {
  const adminEmail = 'phase4c-admin@example.com';
  const adminPassword = 'phase4c-strong-password';
  const genreId = 'e66274ca-60a6-4a2d-b709-23661dc08f21';
  let apiApplication: INestApplication<App>;
  let prismaService: PrismaService;
  let sessionCookie: string;
  let adminUserId: string;

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
    await clearTestRecords();
    const adminUser = await prismaService.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash: await argon2.hash(adminPassword, {
          type: argon2.argon2id,
        }),
      },
    });
    adminUserId = adminUser.id;
    await prismaService.genre.create({
      data: { id: genreId, name: 'Phase 4C', slug: 'phase-4c' },
    });
    sessionCookie = getSessionCookie(
      await request(apiApplication.getHttpServer())
        .post('/api/v1/admin/auth/login')
        .send({ email: adminEmail, password: adminPassword })
        .expect(200),
    );
  });

  afterEach(async () => {
    await prismaService.reservation.deleteMany({
      where: { book: { genreId } },
    });
    await prismaService.book.deleteMany({ where: { genreId } });
  });

  afterAll(async () => {
    await clearTestRecords();
    await apiApplication.close();
  });

  it('requires authentication', async () => {
    await request(apiApplication.getHttpServer())
      .get('/api/v1/admin/reservations')
      .expect(401);
  });

  it('lists, filters, paginates, and returns historical reservation details', async () => {
    const completedReservation = await createReservation(
      ReservationStatus.COMPLETED,
      BookStatus.AVAILABLE,
      'Historical Hobbit',
    );
    await createReservation(
      ReservationStatus.CANCELLED,
      BookStatus.AVAILABLE,
      'Cancelled Book',
    );

    const listResponse = await request(apiApplication.getHttpServer())
      .get(
        '/api/v1/admin/reservations?status=COMPLETED&q=Hobbit&page=1&pageSize=1',
      )
      .set('Cookie', sessionCookie)
      .expect(200);
    const listResponseBody = parseJsonResponse(listResponse);
    expect(listResponseBody['meta']).toMatchObject({ total: 1, page: 1 });
    expect(listResponseBody['data']).toEqual([
      expect.objectContaining({ id: completedReservation.id }),
    ]);

    const detailsResponse = await request(apiApplication.getHttpServer())
      .get(`/api/v1/admin/reservations/${completedReservation.id}`)
      .set('Cookie', sessionCookie)
      .expect(200);
    expect(parseJsonResponse(detailsResponse)).toMatchObject({
      id: completedReservation.id,
      status: ReservationStatus.COMPLETED,
      book: { title: 'Historical Hobbit', status: BookStatus.AVAILABLE },
    });
  });

  it('moves a reserved reservation and book to borrowed and records the admin', async () => {
    const reservation = await createReservation(
      ReservationStatus.RESERVED,
      BookStatus.RESERVED,
      'Borrow Me',
    );

    const transitionResponse = await postTransition(
      reservation.id,
      'mark-borrowed',
    ).expect(201);

    const transitionResponseBody = parseJsonResponse(transitionResponse);
    expect(transitionResponseBody).toMatchObject({
      status: ReservationStatus.BORROWED,
      handledByAdminId: adminUserId,
      book: { status: BookStatus.BORROWED },
    });
    expect(transitionResponseBody['borrowedAt']).toEqual(expect.any(String));
  });

  it('moves a borrowed reservation to completed and makes the book available', async () => {
    const reservation = await createReservation(
      ReservationStatus.BORROWED,
      BookStatus.BORROWED,
      'Return Me',
    );

    const transitionResponse = await postTransition(
      reservation.id,
      'mark-returned',
    ).expect(201);

    const transitionResponseBody = parseJsonResponse(transitionResponse);
    expect(transitionResponseBody).toMatchObject({
      status: ReservationStatus.COMPLETED,
      book: { status: BookStatus.AVAILABLE },
    });
    expect(transitionResponseBody['returnedAt']).toEqual(expect.any(String));
  });

  it('cancels a reserved reservation with a reason and makes the book available', async () => {
    const reservation = await createReservation(
      ReservationStatus.RESERVED,
      BookStatus.RESERVED,
      'Cancel Me',
    );

    const transitionResponse = await postTransition(reservation.id, 'cancel')
      .send({ cancellationReason: ' Requester changed plans ' })
      .expect(201);

    const transitionResponseBody = parseJsonResponse(transitionResponse);
    expect(transitionResponseBody).toMatchObject({
      status: ReservationStatus.CANCELLED,
      cancellationReason: 'Requester changed plans',
      book: { status: BookStatus.AVAILABLE },
    });
    expect(transitionResponseBody['cancelledAt']).toEqual(expect.any(String));
  });

  it('returns 409 for invalid and repeated transitions', async () => {
    const reservation = await createReservation(
      ReservationStatus.RESERVED,
      BookStatus.RESERVED,
      'One Transition',
    );

    await postTransition(reservation.id, 'mark-returned').expect(409);
    await postTransition(reservation.id, 'mark-borrowed').expect(201);
    await postTransition(reservation.id, 'mark-borrowed').expect(409);
    await postTransition(reservation.id, 'cancel').send({}).expect(409);
  });

  it('rolls back the reservation update when the book state does not match', async () => {
    const reservation = await createReservation(
      ReservationStatus.RESERVED,
      BookStatus.AVAILABLE,
      'Inconsistent State',
    );

    await postTransition(reservation.id, 'mark-borrowed').expect(409);

    const storedReservation = await prismaService.reservation.findUniqueOrThrow(
      {
        where: { id: reservation.id },
        include: { book: true },
      },
    );
    expect(storedReservation.status).toBe(ReservationStatus.RESERVED);
    expect(storedReservation.book.status).toBe(BookStatus.AVAILABLE);
    expect(storedReservation.handledByAdminId).toBeNull();
  });

  async function createReservation(
    reservationStatus: ReservationStatus,
    bookStatus: BookStatus,
    bookTitle: string,
  ) {
    return prismaService.reservation.create({
      data: {
        requesterName: 'Svitlana',
        telegramUsername: '@username',
        status: reservationStatus,
        book: {
          create: {
            title: bookTitle,
            author: 'BookNest Author',
            status: bookStatus,
            genreId,
          },
        },
      },
    });
  }

  function postTransition(
    reservationId: string,
    action: 'mark-borrowed' | 'mark-returned' | 'cancel',
  ): request.Test {
    return request(apiApplication.getHttpServer())
      .post(`/api/v1/admin/reservations/${reservationId}/${action}`)
      .set('Cookie', sessionCookie);
  }

  async function clearTestRecords(): Promise<void> {
    await prismaService?.reservation.deleteMany({
      where: { book: { genreId } },
    });
    await prismaService?.book.deleteMany({ where: { genreId } });
    await prismaService?.genre.deleteMany({ where: { id: genreId } });
    await prismaService?.adminUser.deleteMany({ where: { email: adminEmail } });
  }

  function getSessionCookie(loginResponse: request.Response): string {
    const cookieHeader = loginResponse.headers['set-cookie']?.[0];
    if (!cookieHeader) {
      throw new Error('Login did not return a session cookie');
    }
    return cookieHeader.split(';')[0];
  }

  function parseJsonResponse(
    httpResponse: request.Response,
  ): Record<string, unknown> {
    const responseBody: unknown = JSON.parse(httpResponse.text);
    if (!isJsonObject(responseBody)) {
      throw new Error('Expected a JSON object response');
    }
    return responseBody;
  }

  function isJsonObject(
    responseBody: unknown,
  ): responseBody is Record<string, unknown> {
    return typeof responseBody === 'object' && responseBody !== null;
  }
});
