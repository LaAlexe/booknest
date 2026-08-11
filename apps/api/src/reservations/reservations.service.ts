import { ConflictException, Injectable } from '@nestjs/common';
import { BookStatus, Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

const publicReservationSelect = Prisma.validator<Prisma.ReservationSelect>()({
  id: true,
  bookId: true,
  requesterName: true,
  telegramUsername: true,
  status: true,
  reservedAt: true,
  borrowedAt: true,
  returnedAt: true,
  cancelledAt: true,
  cancellationReason: true,
  createdAt: true,
  updatedAt: true,
  book: {
    select: {
      status: true,
    },
  },
});

export type PublicReservation = Prisma.ReservationGetPayload<{
  select: typeof publicReservationSelect;
}>;

interface ClaimedBook {
  id: string;
}

@Injectable()
export class ReservationsService {
  constructor(private readonly prismaService: PrismaService) {}

  create(
    bookId: string,
    createReservationDto: CreateReservationDto,
  ): Promise<PublicReservation> {
    return this.prismaService.$transaction(async (transactionClient) => {
      const claimedBooks = await transactionClient.$queryRaw<ClaimedBook[]>`
        UPDATE "books"
        SET "status" = ${BookStatus.RESERVED}::"BookStatus",
            "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${bookId}::uuid
          AND "status" = ${BookStatus.AVAILABLE}::"BookStatus"
          AND "is_archived" = false
        RETURNING "id"
      `;

      if (claimedBooks.length === 0) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          code: 'BOOK_NOT_AVAILABLE',
          message: 'Book is not available for reservation',
        });
      }

      return transactionClient.reservation.create({
        data: {
          bookId,
          requesterName: createReservationDto.requesterName,
          telegramUsername: createReservationDto.telegramUsername,
          status: ReservationStatus.RESERVED,
        },
        select: publicReservationSelect,
      });
    });
  }
}
