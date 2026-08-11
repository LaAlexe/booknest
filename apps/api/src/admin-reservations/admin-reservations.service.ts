import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookStatus,
  ContentLocale,
  Prisma,
  ReservationStatus,
} from '@prisma/client';
import { selectContentTranslation } from '../content-localization/select-content-translation';
import { PrismaService } from '../database/prisma.service';
import { CancelAdminReservationDto } from './dto/cancel-admin-reservation.dto';
import { ListAdminReservationsQueryDto } from './dto/list-admin-reservations-query.dto';

const adminReservationSelect = Prisma.validator<Prisma.ReservationSelect>()({
  id: true,
  status: true,
  requesterName: true,
  telegramUsername: true,
  reservedAt: true,
  borrowedAt: true,
  returnedAt: true,
  cancelledAt: true,
  cancellationReason: true,
  handledByAdminId: true,
  book: {
    select: {
      id: true,
      status: true,
      translations: {
        where: { locale: ContentLocale.en },
        select: { locale: true, title: true, author: true },
      },
    },
  },
});

type StoredAdminReservation = Prisma.ReservationGetPayload<{
  select: typeof adminReservationSelect;
}>;

export type AdminReservation = Omit<StoredAdminReservation, 'book'> & {
  book: { id: string; title: string; author: string; status: BookStatus };
};

export interface PaginatedAdminReservations {
  data: AdminReservation[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface ReservationTransition {
  expectedReservationStatus: ReservationStatus;
  expectedBookStatus: BookStatus;
  nextReservationStatus: ReservationStatus;
  nextBookStatus: BookStatus;
  reservationChanges: Prisma.ReservationUpdateManyMutationInput;
}

@Injectable()
export class AdminReservationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(
    query: ListAdminReservationsQueryDto,
  ): Promise<PaginatedAdminReservations> {
    const reservationFilters: Prisma.ReservationWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            book: {
              translations: {
                some: {
                  locale: ContentLocale.en,
                  OR: [
                    { title: { contains: query.q, mode: 'insensitive' } },
                    { author: { contains: query.q, mode: 'insensitive' } },
                  ],
                },
              },
            },
          }
        : {}),
    };
    const reservationsToSkip = (query.page - 1) * query.pageSize;
    const [reservations, totalReservations] =
      await this.prismaService.$transaction([
        this.prismaService.reservation.findMany({
          where: reservationFilters,
          select: adminReservationSelect,
          orderBy: [{ reservedAt: 'desc' }, { id: 'asc' }],
          skip: reservationsToSkip,
          take: query.pageSize,
        }),
        this.prismaService.reservation.count({ where: reservationFilters }),
      ]);

    return {
      data: reservations.map((reservation) =>
        this.toAdminReservation(reservation),
      ),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: totalReservations,
        totalPages: Math.ceil(totalReservations / query.pageSize),
      },
    };
  }

  async findOne(reservationId: string): Promise<AdminReservation> {
    const reservation = await this.prismaService.reservation.findUnique({
      where: { id: reservationId },
      select: adminReservationSelect,
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    return this.toAdminReservation(reservation);
  }

  markBorrowed(
    reservationId: string,
    adminUserId: string,
  ): Promise<AdminReservation> {
    return this.applyTransition(reservationId, adminUserId, {
      expectedReservationStatus: ReservationStatus.RESERVED,
      expectedBookStatus: BookStatus.RESERVED,
      nextReservationStatus: ReservationStatus.BORROWED,
      nextBookStatus: BookStatus.BORROWED,
      reservationChanges: { borrowedAt: new Date() },
    });
  }

  markReturned(
    reservationId: string,
    adminUserId: string,
  ): Promise<AdminReservation> {
    return this.applyTransition(reservationId, adminUserId, {
      expectedReservationStatus: ReservationStatus.BORROWED,
      expectedBookStatus: BookStatus.BORROWED,
      nextReservationStatus: ReservationStatus.COMPLETED,
      nextBookStatus: BookStatus.AVAILABLE,
      reservationChanges: { returnedAt: new Date() },
    });
  }

  cancel(
    reservationId: string,
    adminUserId: string,
    cancellation: CancelAdminReservationDto,
  ): Promise<AdminReservation> {
    return this.applyTransition(reservationId, adminUserId, {
      expectedReservationStatus: ReservationStatus.RESERVED,
      expectedBookStatus: BookStatus.RESERVED,
      nextReservationStatus: ReservationStatus.CANCELLED,
      nextBookStatus: BookStatus.AVAILABLE,
      reservationChanges: {
        cancelledAt: new Date(),
        cancellationReason: cancellation.cancellationReason ?? null,
      },
    });
  }

  private applyTransition(
    reservationId: string,
    adminUserId: string,
    transition: ReservationTransition,
  ): Promise<AdminReservation> {
    return this.prismaService.$transaction(async (transactionClient) => {
      const reservation = await transactionClient.reservation.findUnique({
        where: { id: reservationId },
        select: { bookId: true },
      });
      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      const reservationUpdate = await transactionClient.reservation.updateMany({
        where: {
          id: reservationId,
          status: transition.expectedReservationStatus,
        },
        data: {
          status: transition.nextReservationStatus,
          handledByAdminId: adminUserId,
          ...transition.reservationChanges,
        },
      });
      if (reservationUpdate.count !== 1) {
        this.throwTransitionConflict();
      }

      const bookUpdate = await transactionClient.book.updateMany({
        where: {
          id: reservation.bookId,
          status: transition.expectedBookStatus,
        },
        data: { status: transition.nextBookStatus },
      });
      if (bookUpdate.count !== 1) {
        this.throwTransitionConflict();
      }

      const updatedReservation =
        await transactionClient.reservation.findUniqueOrThrow({
          where: { id: reservationId },
          select: adminReservationSelect,
        });
      return this.toAdminReservation(updatedReservation);
    });
  }

  private toAdminReservation(
    reservation: StoredAdminReservation,
  ): AdminReservation {
    const bookTranslation = selectContentTranslation(
      reservation.book.translations,
      ContentLocale.en,
    );
    return {
      ...reservation,
      book: {
        id: reservation.book.id,
        status: reservation.book.status,
        title: bookTranslation.title,
        author: bookTranslation.author,
      },
    };
  }

  private throwTransitionConflict(): never {
    throw new ConflictException({
      statusCode: 409,
      error: 'Conflict',
      code: 'RESERVATION_STATE_CONFLICT',
      message: 'The reservation state no longer allows this action',
    });
  }
}
