import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsOptional,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateBookTranslationsDto } from './book-translations.dto';
import { normalizeOptionalBookField } from './book-field-transforms';

export class CreateAdminBookDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateBookTranslationsDto)
  translations!: CreateBookTranslationsDto;

  @Transform(normalizeOptionalBookField)
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  coverUrl?: string | null;

  @IsUUID('4')
  genreId!: string;
}
