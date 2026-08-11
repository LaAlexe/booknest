import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminProvisioningService } from './admin-provisioning.service';

async function seedInitialAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD before creating the initial admin',
    );
  }
  const applicationContext = await NestFactory.createApplicationContext(
    AppModule,
    { logger: ['error'] },
  );
  try {
    const provisioningService = applicationContext.get(
      AdminProvisioningService,
    );
    const admin = await provisioningService.createInitialAdmin(email, password);
    console.log(`Created BookNest administrator: ${admin.email}`);
  } finally {
    await applicationContext.close();
  }
}

void seedInitialAdmin().catch((provisioningError: unknown) => {
  console.error(provisioningError);
  process.exitCode = 1;
});
