import { CookieOptions, Request } from 'express';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_PATH,
} from './admin-auth.constants';

export function getAdminSessionToken(request: Request): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) {
    return undefined;
  }
  for (const cookiePart of cookieHeader.split(';')) {
    const [cookieName, ...cookieValueParts] = cookiePart.trim().split('=');
    if (cookieName === ADMIN_SESSION_COOKIE) {
      try {
        return decodeURIComponent(cookieValueParts.join('='));
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export function getAdminSessionCookieOptions(expiresAt: Date): CookieOptions {
  return {
    expires: expiresAt,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: ADMIN_SESSION_PATH,
  };
}

export function getClearAdminSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: ADMIN_SESSION_PATH,
  };
}
