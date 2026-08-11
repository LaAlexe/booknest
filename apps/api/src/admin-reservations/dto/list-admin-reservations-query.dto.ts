import { ReservationStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trimSearchQuery = ({
  value: searchInput,
}: {
  value: unknown;
}): unknown =>
  typeof searchInput === 'string' ? searchInput.trim() : searchInput;

export class ListAdminReservationsQueryDto {
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
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @Transform(trimSearchQuery)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  q?: string;
}
