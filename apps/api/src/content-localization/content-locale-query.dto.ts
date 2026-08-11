import { ContentLocale } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ContentLocaleQueryDto {
  @IsOptional()
  @IsEnum(ContentLocale)
  locale: ContentLocale = ContentLocale.en;
}
