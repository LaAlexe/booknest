import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  normalizeOptionalBookField,
  trimRequiredBookField,
} from './book-field-transforms';

export class BookTranslationDto {
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
}

export class CreateBookTranslationsDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => BookTranslationDto)
  en!: BookTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookTranslationDto)
  uk?: BookTranslationDto;
}

export class UpdateBookTranslationsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => BookTranslationDto)
  en?: BookTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookTranslationDto)
  uk?: BookTranslationDto;
}
