import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import type { AdminProfile } from '../admin-auth/admin-auth.types';
import { CurrentAdmin } from '../admin-auth/current-admin.decorator';
import {
  AdminReservation,
  AdminReservationsService,
  PaginatedAdminReservations,
} from './admin-reservations.service';
import { CancelAdminReservationDto } from './dto/cancel-admin-reservation.dto';
import { ListAdminReservationsQueryDto } from './dto/list-admin-reservations-query.dto';

@Controller('admin/reservations')
@UseGuards(AdminAuthGuard)
export class AdminReservationsController {
  constructor(
    private readonly adminReservationsService: AdminReservationsService,
  ) {}

  @Get()
  findAll(
    @Query() query: ListAdminReservationsQueryDto,
  ): Promise<PaginatedAdminReservations> {
    return this.adminReservationsService.findAll(query);
  }

  @Get(':reservationId')
  findOne(
    @Param('reservationId', new ParseUUIDPipe({ version: '4' }))
    reservationId: string,
  ): Promise<AdminReservation> {
    return this.adminReservationsService.findOne(reservationId);
  }

  @Post(':reservationId/mark-borrowed')
  markBorrowed(
    @Param('reservationId', new ParseUUIDPipe({ version: '4' }))
    reservationId: string,
    @CurrentAdmin() admin: AdminProfile,
  ): Promise<AdminReservation> {
    return this.adminReservationsService.markBorrowed(reservationId, admin.id);
  }

  @Post(':reservationId/mark-returned')
  markReturned(
    @Param('reservationId', new ParseUUIDPipe({ version: '4' }))
    reservationId: string,
    @CurrentAdmin() admin: AdminProfile,
  ): Promise<AdminReservation> {
    return this.adminReservationsService.markReturned(reservationId, admin.id);
  }

  @Post(':reservationId/cancel')
  cancel(
    @Param('reservationId', new ParseUUIDPipe({ version: '4' }))
    reservationId: string,
    @CurrentAdmin() admin: AdminProfile,
    @Body() cancellation: CancelAdminReservationDto,
  ): Promise<AdminReservation> {
    return this.adminReservationsService.cancel(
      reservationId,
      admin.id,
      cancellation,
    );
  }
}
