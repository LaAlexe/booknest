import { Transform, Type } from 'class-transformer';
import { ContentLocale } from '@prisma/client';
import {
  IsInt,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trimString = ({ value: inputValue }: { value: unknown }): unknown =>
  typeof inputValue === 'string' ? inputValue.trim() : inputValue;

export class ListBooksQueryDto {
  @IsOptional()
  @IsEnum(ContentLocale)
  locale: ContentLocale = ContentLocale.en;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(100)
  genre?: string;
}
