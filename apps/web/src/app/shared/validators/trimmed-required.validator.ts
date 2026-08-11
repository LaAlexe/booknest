import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const trimmedRequiredValidator: ValidatorFn = (
  formControl: AbstractControl<string>,
): ValidationErrors | null =>
  formControl.value.trim().length > 0 ? null : { required: true };
