import { BookStatus } from './catalog.models';

export type ReservationStatus =
  'RESERVED' | 'BORROWED' | 'COMPLETED' | 'CANCELLED';

export interface CreateReservationRequest {
  requesterName: string;
  telegramUsername: string;
}

export interface Reservation {
  id: string;
  bookId: string;
  requesterName: string;
  telegramUsername: string;
  status: ReservationStatus;
  reservedAt: string;
  borrowedAt: string | null;
  returnedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  book: {
    status: BookStatus;
  };
}
