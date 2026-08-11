import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { PublicReservation, ReservationsService } from './reservations.service';

@Controller('books/:bookId/reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(
    @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<PublicReservation> {
    return this.reservationsService.create(bookId, createReservationDto);
  }
}
