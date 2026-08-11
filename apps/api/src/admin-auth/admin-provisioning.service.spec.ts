import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { AdminProvisioningService } from './admin-provisioning.service';
import { PasswordHasherService } from './password-hasher.service';

describe('AdminProvisioningService', () => {
  const countAdmins = jest.fn();
  const createAdmin = jest.fn();
  const hashPassword = jest.fn();
  let provisioningService: AdminProvisioningService;

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        AdminProvisioningService,
        {
          provide: PrismaService,
          useValue: {
            adminUser: { count: countAdmins, create: createAdmin },
          },
        },
        {
          provide: PasswordHasherService,
          useValue: { hash: hashPassword },
        },
      ],
    }).compile();
    provisioningService = testingModule.get(AdminProvisioningService);
    jest.clearAllMocks();
  });

  it('creates the initial admin with normalized email and hashed password', async () => {
    countAdmins.mockResolvedValue(0);
    hashPassword.mockResolvedValue('argon-password-hash');
    createAdmin.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
    });

    await expect(
      provisioningService.createInitialAdmin(
        ' Admin@Example.com ',
        'strong-password',
      ),
    ).resolves.toEqual({ id: 'admin-1', email: 'admin@example.com' });
    expect(createAdmin).toHaveBeenCalledWith({
      data: {
        email: 'admin@example.com',
        passwordHash: 'argon-password-hash',
      },
      select: { id: true, email: true },
    });
  });

  it('refuses to create another initial admin', async () => {
    countAdmins.mockResolvedValue(1);

    await expect(
      provisioningService.createInitialAdmin(
        'admin@example.com',
        'strong-password',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(hashPassword).not.toHaveBeenCalled();
  });
});
