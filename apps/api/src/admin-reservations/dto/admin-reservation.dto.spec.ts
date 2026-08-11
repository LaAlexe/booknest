import 'reflect-metadata';
import { ReservationStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CancelAdminReservationDto } from './cancel-admin-reservation.dto';
import { ListAdminReservationsQueryDto } from './list-admin-reservations-query.dto';

describe('admin reservation DTOs', () => {
  it('accepts status, search, and pagination filters', async () => {
    const listQuery = plainToInstance(ListAdminReservationsQueryDto, {
      page: '2',
      pageSize: '10',
      status: ReservationStatus.BORROWED,
      q: ' Hobbit ',
    });

    await expect(validate(listQuery)).resolves.toHaveLength(0);
    expect(listQuery).toMatchObject({
      page: 2,
      pageSize: 10,
      status: ReservationStatus.BORROWED,
      q: 'Hobbit',
    });
  });

  it('rejects invalid filters', async () => {
    const listQuery = plainToInstance(ListAdminReservationsQueryDto, {
      page: 0,
      pageSize: 101,
      status: 'PENDING',
      q: ' ',
    });

    expect(await validate(listQuery)).not.toHaveLength(0);
  });

  it('normalizes an optional cancellation reason', async () => {
    const cancellation = plainToInstance(CancelAdminReservationDto, {
      cancellationReason: ' No longer needed ',
    });

    await expect(validate(cancellation)).resolves.toHaveLength(0);
    expect(cancellation.cancellationReason).toBe('No longer needed');
  });
});
