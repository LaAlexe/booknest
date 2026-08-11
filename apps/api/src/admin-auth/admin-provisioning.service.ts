import { ConflictException, Injectable } from '@nestjs/common';
import { isEmail } from 'class-validator';
import { PrismaService } from '../database/prisma.service';
import { normalizeAdminEmail } from './admin-email';
import { AdminProfile } from './admin-auth.types';
import { PasswordHasherService } from './password-hasher.service';

@Injectable()
export class AdminProvisioningService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  async createInitialAdmin(
    email: string,
    password: string,
  ): Promise<AdminProfile> {
    const normalizedEmail = normalizeAdminEmail(email);
    if (
      !isEmail(normalizedEmail) ||
      normalizedEmail.length > 320 ||
      password.length < 12 ||
      password.length > 128
    ) {
      throw new Error(
        'ADMIN_EMAIL must be valid and ADMIN_PASSWORD must contain 12 to 128 characters',
      );
    }
    const existingAdmin = await this.prismaService.adminUser.count();
    if (existingAdmin > 0) {
      throw new ConflictException('An administrator already exists');
    }
    const passwordHash = await this.passwordHasher.hash(password);
    return this.prismaService.adminUser.create({
      data: { email: normalizedEmail, passwordHash },
      select: { id: true, email: true },
    });
  }
}
