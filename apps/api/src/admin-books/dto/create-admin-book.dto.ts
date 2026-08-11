import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  normalizeOptionalBookField,
  trimRequiredBookField,
} from './book-field-transforms';

export class CreateAdminBookDto {
  @Transform(trimRequiredBookField)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @Transform(trimRequiredBookField)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  author!: string;

  @Transform(normalizeOptionalBookField)
  @IsOptional()
  @IsString()
  description?: string | null;

  @Transform(normalizeOptionalBookField)
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  coverUrl?: string | null;

  @IsUUID('4')
  genreId!: string;
}
