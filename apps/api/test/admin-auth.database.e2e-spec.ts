import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import argon2 from 'argon2';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Admin authentication (database e2e)', () => {
  const adminEmail = 'phase4a-admin@example.com';
  const adminPassword = 'phase4a-strong-password';
  let apiApplication: INestApplication<App>;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    apiApplication = testingModule.createNestApplication();
    apiApplication.setGlobalPrefix('api/v1');
    apiApplication.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await apiApplication.init();
    prismaService = apiApplication.get(PrismaService);
    await prismaService.adminSession.deleteMany({
      where: { adminUser: { email: adminEmail } },
    });
    await prismaService.adminUser.deleteMany({ where: { email: adminEmail } });
    await prismaService.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash: await argon2.hash(adminPassword, {
          type: argon2.argon2id,
        }),
      },
    });
  });

  afterAll(async () => {
    await prismaService.adminUser.deleteMany({ where: { email: adminEmail } });
    await apiApplication.close();
  });

  it('logs in, sets an HttpOnly session cookie, and returns only a safe profile', async () => {
    const loginResponse = await login().expect(200);
    const loginResponseBody = parseJsonResponse(loginResponse);

    expect(loginResponseBody['id']).toEqual(expect.any(String));
    expect(loginResponseBody['email']).toBe(adminEmail);
    expect(loginResponseBody).not.toHaveProperty('passwordHash');
    expect(loginResponseBody).not.toHaveProperty('tokenHash');
    expect(loginResponse.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(loginResponse.headers['set-cookie']?.[0]).toContain(
      'SameSite=Strict',
    );
  });

  it('rejects invalid credentials without identifying the invalid field', async () => {
    const invalidLoginResponse = await request(apiApplication.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ email: adminEmail, password: 'incorrect-password' })
      .expect(401);

    expect(parseJsonResponse(invalidLoginResponse)['message']).toBe(
      'Invalid email or password',
    );
  });

  it('returns the current admin for a valid session and rejects no session', async () => {
    const sessionCookie = getSessionCookie(await login());

    const currentAdminResponse = await request(apiApplication.getHttpServer())
      .get('/api/v1/admin/auth/me')
      .set('Cookie', sessionCookie)
      .expect(200);
    const currentAdminBody = parseJsonResponse(currentAdminResponse);
    expect(currentAdminBody['id']).toEqual(expect.any(String));
    expect(currentAdminBody['email']).toBe(adminEmail);
    await request(apiApplication.getHttpServer())
      .get('/api/v1/admin/auth/me')
      .expect(401);
  });

  it('invalidates the session on logout and succeeds when already logged out', async () => {
    const sessionCookie = getSessionCookie(await login());

    await request(apiApplication.getHttpServer())
      .post('/api/v1/admin/auth/logout')
      .set('Cookie', sessionCookie)
      .expect(200)
      .expect({ success: true });
    await request(apiApplication.getHttpServer())
      .get('/api/v1/admin/auth/me')
      .set('Cookie', sessionCookie)
      .expect(401);
    await request(apiApplication.getHttpServer())
      .post('/api/v1/admin/auth/logout')
      .expect(200)
      .expect({ success: true });
  });

  it('rejects an expired session', async () => {
    const sessionCookie = getSessionCookie(await login());
    await prismaService.adminSession.updateMany({
      where: { adminUser: { email: adminEmail } },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });

    await request(apiApplication.getHttpServer())
      .get('/api/v1/admin/auth/me')
      .set('Cookie', sessionCookie)
      .expect(401);
  });

  function login(): request.Test {
    return request(apiApplication.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ email: adminEmail, password: adminPassword });
  }

  function getSessionCookie(loginResponse: request.Response): string {
    const sessionCookie = loginResponse.headers['set-cookie']?.[0];
    if (!sessionCookie) {
      throw new Error('Login did not return a session cookie');
    }
    return sessionCookie.split(';')[0];
  }

  function parseJsonResponse(
    httpResponse: request.Response,
  ): Record<string, unknown> {
    const responseBody: unknown = JSON.parse(httpResponse.text);
    if (!isJsonObject(responseBody)) {
      throw new Error('Expected a JSON object response');
    }
    return responseBody;
  }

  function isJsonObject(
    responseBody: unknown,
  ): responseBody is Record<string, unknown> {
    return typeof responseBody === 'object' && responseBody !== null;
  }
});
