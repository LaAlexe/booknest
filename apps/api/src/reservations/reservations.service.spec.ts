import { ConflictException } from '@nestjs/common';
import { BookStatus, ReservationStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  const bookId = '6c06bb7b-5294-4a22-b37c-d69214c08062';
  const reservationRequest: CreateReservationDto = {
    requesterName: 'Svitlana',
    telegramUsername: '@username',
  };
  const createdReservation = {
    id: 'eb3865f0-8ef4-41a4-bc57-7c762806438d',
    bookId,
    requesterName: reservationRequest.requesterName,
    telegramUsername: reservationRequest.telegramUsername,
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
  const claimAvailableBook =
    jest.fn<(conditionalUpdate: unknown) => Promise<Array<{ id: string }>>>();
  const createReservation =
    jest.fn<(createArguments: unknown) => Promise<typeof createdReservation>>();
  const runTransaction = jest.fn();
  let reservationsService: ReservationsService;

  beforeEach(async () => {
    runTransaction.mockImplementation(
      async (
        transactionOperation: (transactionClient: {
          $queryRaw: typeof claimAvailableBook;
          reservation: { create: typeof createReservation };
        }) => Promise<unknown>,
      ) =>
        transactionOperation({
          $queryRaw: claimAvailableBook,
          reservation: { create: createReservation },
        }),
    );
    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: PrismaService,
          useValue: { $transaction: runTransaction },
        },
      ],
    }).compile();
    reservationsService = testingModule.get(ReservationsService);
    jest.clearAllMocks();
  });

  it('atomically claims the book and creates a reserved reservation', async () => {
    claimAvailableBook.mockResolvedValue([{ id: bookId }]);
    createReservation.mockResolvedValue(createdReservation);

    await expect(
      reservationsService.create(bookId, reservationRequest),
    ).resolves.toEqual(createdReservation);

    expect(claimAvailableBook).toHaveBeenCalledWith(
      expect.any(Array),
      BookStatus.RESERVED,
      bookId,
      BookStatus.AVAILABLE,
    );
    expect(createReservation).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          bookId,
          requesterName: reservationRequest.requesterName,
          telegramUsername: reservationRequest.telegramUsername,
          status: ReservationStatus.RESERVED,
        },
      }),
    );
  });

  it('returns BOOK_NOT_AVAILABLE when the conditional book claim loses', async () => {
    claimAvailableBook.mockResolvedValue([]);

    await expect(
      reservationsService.create(bookId, reservationRequest),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(createReservation).not.toHaveBeenCalled();
  });

  it('propagates reservation creation failures so the transaction rolls back', async () => {
    claimAvailableBook.mockResolvedValue([{ id: bookId }]);
    createReservation.mockRejectedValue(new Error('Insert failed'));

    await expect(
      reservationsService.create(bookId, reservationRequest),
    ).rejects.toThrow('Insert failed');
    expect(runTransaction).toHaveBeenCalledTimes(1);
  });
});
