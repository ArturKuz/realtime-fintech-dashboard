import {
  MaxValidationError,
  MinValidationError,
  RequiredValidationError,
  type ValidationError,
} from '@angular/forms/signals';

/** Text shown under a field for one validation error. */
export function validationMessage(error: ValidationError): string {
  // Custom validators and parse errors bring their own wording.
  if (error.message !== undefined) {
    return error.message;
  }
  if (error instanceof RequiredValidationError) {
    return 'Enter a value.';
  }
  if (error instanceof MinValidationError) {
    return `Enter ${error.min} or more.`;
  }
  if (error instanceof MaxValidationError) {
    return `Enter ${error.max} or less.`;
  }
  return 'Enter a valid value.';
}
