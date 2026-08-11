import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { normalizeAdminEmail } from '../admin-email';

export class AdminLoginDto {
  @Transform(({ value: emailInput }: { value: unknown }) =>
    typeof emailInput === 'string'
      ? normalizeAdminEmail(emailInput)
      : emailInput,
  )
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}
