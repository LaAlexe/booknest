import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminProfile } from './admin-auth.types';
import { AuthenticatedAdminRequest, CURRENT_ADMIN } from './admin-auth.guard';

export const CurrentAdmin = createParamDecorator(
  (
    _decoratorData: unknown,
    executionContext: ExecutionContext,
  ): AdminProfile => {
    const request = executionContext
      .switchToHttp()
      .getRequest<AuthenticatedAdminRequest>();
    const admin = request[CURRENT_ADMIN];
    if (!admin) {
      throw new Error('AdminAuthGuard must run before CurrentAdmin');
    }
    return admin;
  },
);
