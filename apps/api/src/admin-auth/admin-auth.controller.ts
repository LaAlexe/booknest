import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';
import type { AdminProfile } from './admin-auth.types';
import { ADMIN_SESSION_COOKIE } from './admin-auth.constants';
import {
  getAdminSessionCookieOptions,
  getAdminSessionToken,
  getClearAdminSessionCookieOptions,
} from './admin-cookie';
import { AdminSessionsService } from './admin-sessions.service';
import { CurrentAdmin } from './current-admin.decorator';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly adminSessionsService: AdminSessionsService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() adminLogin: AdminLoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AdminProfile> {
    const createdSession = await this.adminAuthService.login(adminLogin);
    response.cookie(
      ADMIN_SESSION_COOKIE,
      createdSession.sessionToken,
      getAdminSessionCookieOptions(createdSession.expiresAt),
    );
    return createdSession.admin;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    const sessionToken = getAdminSessionToken(request);
    if (sessionToken) {
      await this.adminSessionsService.revokeSession(sessionToken);
    }
    response.clearCookie(
      ADMIN_SESSION_COOKIE,
      getClearAdminSessionCookieOptions(),
    );
    return { success: true };
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  getCurrentAdmin(@CurrentAdmin() admin: AdminProfile): AdminProfile {
    return admin;
  }
}
