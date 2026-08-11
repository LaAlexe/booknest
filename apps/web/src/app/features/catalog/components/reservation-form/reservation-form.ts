import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { BookStatus } from '../../models/catalog.models';
import {
  CreateReservationRequest,
  Reservation,
} from '../../models/reservation.models';
import { ReservationApiService } from '../../services/reservation-api.service';
import { trimmedRequiredValidator } from '../../../../shared/validators/trimmed-required.validator';

const TELEGRAM_USERNAME_PATTERN = /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/;

const validTelegramUsername = (
  formControl: AbstractControl<string>,
): { telegramUsername: true } | null => {
  const telegramUsername = formControl.value.trim();
  if (!telegramUsername) {
    return null;
  }
  return TELEGRAM_USERNAME_PATTERN.test(telegramUsername)
    ? null
    : { telegramUsername: true };
};

@Component({
  selector: 'app-reservation-form',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './reservation-form.html',
  styleUrl: './reservation-form.scss',
})
export class ReservationForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly reservationApiService = inject(ReservationApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly bookId = input.required<string>();
  readonly bookStatus = input.required<BookStatus>();
  readonly reservationSucceeded = output<Reservation>();
  readonly availabilityConflict = output<void>();

  protected readonly reservationForm = this.formBuilder.nonNullable.group({
    requesterName: ['', [trimmedRequiredValidator, Validators.maxLength(150)]],
    telegramUsername: ['', [trimmedRequiredValidator, validTelegramUsername]],
  });
  protected readonly isSubmitting = signal(false);
  protected readonly hasAttemptedSubmission = signal(false);
  protected readonly successfulReservation = signal<Reservation | null>(null);
  protected readonly hasAvailabilityConflict = signal(false);
  protected readonly hasSubmissionError = signal(false);
  protected readonly isAvailable = computed(
    () =>
      this.bookStatus() === 'AVAILABLE' &&
      !this.hasAvailabilityConflict() &&
      this.successfulReservation() === null,
  );

  protected submitReservation(): void {
    this.hasAttemptedSubmission.set(true);
    if (!this.isAvailable() || this.isSubmitting()) {
      return;
    }
    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.hasSubmissionError.set(false);
    const reservationRequest = this.getReservationRequest();
    this.reservationApiService
      .createReservation(this.bookId(), reservationRequest)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (reservation) => this.handleReservationSuccess(reservation),
        error: (httpError: unknown) => this.handleReservationError(httpError),
      });
  }

  protected shouldShowValidationError(
    formControl: AbstractControl<string>,
  ): boolean {
    return (
      formControl.invalid &&
      (formControl.touched ||
        formControl.dirty ||
        this.hasAttemptedSubmission())
    );
  }

  private getReservationRequest(): CreateReservationRequest {
    const formValue = this.reservationForm.getRawValue();
    return {
      requesterName: formValue.requesterName.trim(),
      telegramUsername: formValue.telegramUsername.trim(),
    };
  }

  private handleReservationSuccess(reservation: Reservation): void {
    this.successfulReservation.set(reservation);
    this.reservationSucceeded.emit(reservation);
  }

  private handleReservationError(httpError: unknown): void {
    if (this.isBookNotAvailableError(httpError)) {
      this.hasAvailabilityConflict.set(true);
      this.availabilityConflict.emit();
      return;
    }
    this.hasSubmissionError.set(true);
  }

  private isBookNotAvailableError(httpError: unknown): boolean {
    if (!(httpError instanceof HttpErrorResponse) || httpError.status !== 409) {
      return false;
    }
    const errorResponse: unknown = httpError.error;
    return (
      typeof errorResponse === 'object' &&
      errorResponse !== null &&
      'code' in errorResponse &&
      errorResponse.code === 'BOOK_NOT_AVAILABLE'
    );
  }
}
