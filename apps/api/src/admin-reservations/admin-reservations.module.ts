import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminReservationsController } from './admin-reservations.controller';
import { AdminReservationsService } from './admin-reservations.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminReservationsController],
  providers: [AdminReservationsService],
})
export class AdminReservationsModule {}
