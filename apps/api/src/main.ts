import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrapApplication(): Promise<void> {
  const apiApplication = await NestFactory.create(AppModule);
  apiApplication.setGlobalPrefix('api/v1');
  apiApplication.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  await apiApplication.listen(process.env.PORT ?? 3000);
}
void bootstrapApplication();
