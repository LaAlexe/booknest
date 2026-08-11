import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminProfile } from './admin-auth.types';
import { getAdminSessionToken } from './admin-cookie';
import { AdminSessionsService } from './admin-sessions.service';

export const CURRENT_ADMIN = Symbol('CURRENT_ADMIN');
export type AuthenticatedAdminRequest = Request & {
  [CURRENT_ADMIN]?: AdminProfile;
};

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly adminSessionsService: AdminSessionsService) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const request = executionContext
      .switchToHttp()
      .getRequest<AuthenticatedAdminRequest>();
    const sessionToken = getAdminSessionToken(request);
    if (!sessionToken) {
      throw new UnauthorizedException();
    }
    const admin = await this.adminSessionsService.validateSession(sessionToken);
    if (!admin) {
      throw new UnauthorizedException();
    }
    request[CURRENT_ADMIN] = admin;
    return true;
  }
}
