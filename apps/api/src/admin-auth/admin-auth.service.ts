import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { normalizeAdminEmail } from './admin-email';
import { CreatedAdminSession } from './admin-auth.types';
import { AdminSessionsService } from './admin-sessions.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { PasswordHasherService } from './password-hasher.service';

const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$bm+AcLhg8WrNllNcZ+yPWQ$tMr5xaUA+oW3lfGd/9kaL25OkbTOs3wa6LJU3mDJYYA';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly adminSessionsService: AdminSessionsService,
  ) {}

  async login(adminLogin: AdminLoginDto): Promise<CreatedAdminSession> {
    const adminUser = await this.prismaService.adminUser.findUnique({
      where: { email: normalizeAdminEmail(adminLogin.email) },
      select: { id: true, email: true, passwordHash: true },
    });
    const isPasswordValid = await this.passwordHasher.verify(
      adminUser?.passwordHash ?? DUMMY_PASSWORD_HASH,
      adminLogin.password,
    );
    if (!adminUser || !isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.adminSessionsService.createSession({
      id: adminUser.id,
      email: adminUser.email,
    });
  }
}
