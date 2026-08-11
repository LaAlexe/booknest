import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

const TELEGRAM_USERNAME_PATTERN = /^@[a-z][a-z0-9_]{4,31}$/;

const trimRequesterName = ({
  value: requesterNameInput,
}: {
  value: unknown;
}): unknown =>
  typeof requesterNameInput === 'string'
    ? requesterNameInput.trim()
    : requesterNameInput;

export function normalizeTelegramUsername(
  telegramUsernameInput: unknown,
): unknown {
  if (typeof telegramUsernameInput !== 'string') {
    return telegramUsernameInput;
  }

  const trimmedUsername = telegramUsernameInput.trim().toLowerCase();
  return trimmedUsername.startsWith('@')
    ? trimmedUsername
    : `@${trimmedUsername}`;
}

export class CreateReservationDto {
  @Transform(trimRequesterName)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  requesterName!: string;

  @Transform(({ value: telegramUsernameInput }: { value: unknown }) =>
    normalizeTelegramUsername(telegramUsernameInput),
  )
  @IsString()
  @Matches(TELEGRAM_USERNAME_PATTERN, {
    message:
      'telegramUsername must contain 5 to 32 letters, numbers, or underscores and start with a letter',
  })
  telegramUsername!: string;
}
