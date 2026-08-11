import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { UpdateBookTranslationsDto } from './book-translations.dto';
import { normalizeOptionalBookField } from './book-field-transforms';

export class UpdateAdminBookDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBookTranslationsDto)
  translations?: UpdateBookTranslationsDto;

  @Transform(normalizeOptionalBookField)
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  coverUrl?: string | null;

  @IsOptional()
  @IsUUID('4')
  genreId?: string;
}
