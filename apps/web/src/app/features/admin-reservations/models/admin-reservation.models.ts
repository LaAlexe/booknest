import { BookStatus } from '../../catalog/models/catalog.models';

export type ReservationStatus =
  'RESERVED' | 'BORROWED' | 'COMPLETED' | 'CANCELLED';

export interface AdminReservation {
  readonly id: string;
  readonly status: ReservationStatus;
  readonly requesterName: string;
  readonly telegramUsername: string;
  readonly reservedAt: string;
  readonly borrowedAt: string | null;
  readonly returnedAt: string | null;
  readonly cancelledAt: string | null;
  readonly cancellationReason: string | null;
  readonly handledByAdminId: string | null;
  readonly book: {
    readonly id: string;
    readonly title: string;
    readonly author: string;
    readonly status: BookStatus;
  };
}

export interface AdminReservationsPage {
  readonly data: AdminReservation[];
  readonly meta: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

export interface AdminReservationFilters {
  readonly page: number;
  readonly pageSize: number;
  readonly status?: ReservationStatus;
  readonly q?: string;
}
