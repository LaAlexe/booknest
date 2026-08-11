import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { AdminProfile, CreatedAdminSession } from './admin-auth.types';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

@Injectable()
export class AdminSessionsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createSession(admin: AdminProfile): Promise<CreatedAdminSession> {
    const sessionToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + this.getSessionTtlHours() * MILLISECONDS_PER_HOUR,
    );
    await this.prismaService.adminSession.create({
      data: {
        adminUserId: admin.id,
        tokenHash: this.hashSessionToken(sessionToken),
        expiresAt,
      },
    });
    return { admin, sessionToken, expiresAt };
  }

  async validateSession(sessionToken: string): Promise<AdminProfile | null> {
    const tokenHash = this.hashSessionToken(sessionToken);
    const adminSession = await this.prismaService.adminSession.findUnique({
      where: { tokenHash },
      select: {
        expiresAt: true,
        adminUser: { select: { id: true, email: true } },
      },
    });
    if (!adminSession) {
      return null;
    }
    if (adminSession.expiresAt <= new Date()) {
      await this.prismaService.adminSession.deleteMany({
        where: { tokenHash },
      });
      return null;
    }
    return adminSession.adminUser;
  }

  async revokeSession(sessionToken: string): Promise<void> {
    await this.prismaService.adminSession.deleteMany({
      where: { tokenHash: this.hashSessionToken(sessionToken) },
    });
  }

  private hashSessionToken(sessionToken: string): string {
    return createHash('sha256').update(sessionToken).digest('hex');
  }

  private getSessionTtlHours(): number {
    return this.configService.get<number>('ADMIN_SESSION_TTL_HOURS', 12);
  }
}
