import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { AdminAuthService } from './admin-auth.service';
import { AdminSessionsService } from './admin-sessions.service';
import { PasswordHasherService } from './password-hasher.service';

describe('AdminAuthService', () => {
  const findAdmin = jest.fn();
  const verifyPassword = jest.fn();
  const createSession = jest.fn();
  let adminAuthService: AdminAuthService;

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        {
          provide: PrismaService,
          useValue: { adminUser: { findUnique: findAdmin } },
        },
        {
          provide: PasswordHasherService,
          useValue: { verify: verifyPassword },
        },
        {
          provide: AdminSessionsService,
          useValue: { createSession },
        },
      ],
    }).compile();
    adminAuthService = testingModule.get(AdminAuthService);
    jest.clearAllMocks();
  });

  it('logs in with normalized email and creates a session', async () => {
    findAdmin.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      passwordHash: 'password-hash',
    });
    verifyPassword.mockResolvedValue(true);
    createSession.mockResolvedValue({
      admin: { id: 'admin-1', email: 'admin@example.com' },
    });

    await adminAuthService.login({
      email: ' Admin@Example.com ',
      password: 'strong-password',
    });

    expect(findAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'admin@example.com' } }),
    );
    expect(createSession).toHaveBeenCalledWith({
      id: 'admin-1',
      email: 'admin@example.com',
    });
  });

  it('returns the same generic error for invalid credentials', async () => {
    findAdmin.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      passwordHash: 'password-hash',
    });
    verifyPassword.mockResolvedValue(false);

    await expect(
      adminAuthService.login({
        email: 'admin@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({
      constructor: UnauthorizedException,
      message: 'Invalid email or password',
    });
  });

  it('performs password verification even when the email does not exist', async () => {
    findAdmin.mockResolvedValue(null);
    verifyPassword.mockResolvedValue(false);

    await expect(
      adminAuthService.login({
        email: 'missing@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifyPassword).toHaveBeenCalledTimes(1);
  });
});
