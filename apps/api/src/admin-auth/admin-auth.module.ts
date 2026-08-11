import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminProvisioningService } from './admin-provisioning.service';
import { AdminSessionsService } from './admin-sessions.service';
import { PasswordHasherService } from './password-hasher.service';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }])],
  controllers: [AdminAuthController],
  providers: [
    AdminAuthGuard,
    AdminAuthService,
    AdminProvisioningService,
    AdminSessionsService,
    PasswordHasherService,
  ],
  exports: [AdminAuthGuard, AdminSessionsService],
})
export class AdminAuthModule {}
