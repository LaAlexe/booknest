import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const normalizeCancellationReason = ({
  value: cancellationReason,
}: {
  value: unknown;
}): unknown => {
  if (typeof cancellationReason !== 'string') {
    return cancellationReason;
  }
  return cancellationReason.trim() || null;
};

export class CancelAdminReservationDto {
  @Transform(normalizeCancellationReason)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cancellationReason?: string | null;
}
