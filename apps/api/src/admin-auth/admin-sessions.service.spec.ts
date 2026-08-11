import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { AdminSessionsService } from './admin-sessions.service';

describe('AdminSessionsService', () => {
  let storedSessionCreateArguments: {
    data: { adminUserId: string; tokenHash: string; expiresAt: Date };
  } | null;
  const createSessionRecord = (createArguments: {
    data: { adminUserId: string; tokenHash: string; expiresAt: Date };
  }): Promise<{ id: string }> => {
    storedSessionCreateArguments = createArguments;
    return Promise.resolve({ id: 'session-1' });
  };
  const findSession = jest.fn();
  const deleteSessions = jest.fn();
  let adminSessionsService: AdminSessionsService;

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSessionsService,
        {
          provide: PrismaService,
          useValue: {
            adminSession: {
              create: createSessionRecord,
              findUnique: findSession,
              deleteMany: deleteSessions,
            },
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(12) },
        },
      ],
    }).compile();
    adminSessionsService = testingModule.get(AdminSessionsService);
    storedSessionCreateArguments = null;
    jest.clearAllMocks();
  });

  it('stores only a hash of a cryptographically random session token', async () => {
    const createdSession = await adminSessionsService.createSession({
      id: 'admin-1',
      email: 'admin@example.com',
    });

    expect(createdSession.sessionToken).toHaveLength(43);
    expect(storedSessionCreateArguments?.data.tokenHash).toHaveLength(64);
    expect(storedSessionCreateArguments?.data.tokenHash).not.toBe(
      createdSession.sessionToken,
    );
  });

  it('rejects and deletes an expired session', async () => {
    findSession.mockResolvedValue({
      expiresAt: new Date(Date.now() - 1_000),
      adminUser: { id: 'admin-1', email: 'admin@example.com' },
    });
    deleteSessions.mockResolvedValue({ count: 1 });

    await expect(
      adminSessionsService.validateSession('expired-token'),
    ).resolves.toBeNull();
    expect(deleteSessions).toHaveBeenCalledTimes(1);
  });

  it('returns a safe profile for a valid session', async () => {
    const adminProfile = { id: 'admin-1', email: 'admin@example.com' };
    findSession.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      adminUser: adminProfile,
    });

    await expect(
      adminSessionsService.validateSession('valid-token'),
    ).resolves.toEqual(adminProfile);
  });
});
