import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateReservationDto,
  normalizeTelegramUsername,
} from './create-reservation.dto';

describe('CreateReservationDto', () => {
  it('trims the requester name and normalizes the Telegram username', async () => {
    const reservationRequest = plainToInstance(CreateReservationDto, {
      requesterName: '  Svitlana  ',
      telegramUsername: ' Book_Nest ',
    });

    await expect(validate(reservationRequest)).resolves.toHaveLength(0);
    expect(reservationRequest.requesterName).toBe('Svitlana');
    expect(reservationRequest.telegramUsername).toBe('@book_nest');
  });

  it.each([undefined, '', '   '])(
    'rejects invalid requesterName %p',
    async (invalidRequesterName) => {
      const reservationRequest = plainToInstance(CreateReservationDto, {
        requesterName: invalidRequesterName,
        telegramUsername: '@valid_name',
      });

      expect(await validate(reservationRequest)).not.toHaveLength(0);
    },
  );

  it.each([undefined, '', '@abc', '@1username', '@invalid-name', '@username!'])(
    'rejects invalid telegramUsername %p',
    async (invalidTelegramUsername) => {
      const reservationRequest = plainToInstance(CreateReservationDto, {
        requesterName: 'Svitlana',
        telegramUsername: invalidTelegramUsername,
      });

      expect(await validate(reservationRequest)).not.toHaveLength(0);
    },
  );

  it('preserves non-string input for validation to reject', () => {
    expect(normalizeTelegramUsername(42)).toBe(42);
  });
});
