import { type ValidationError } from '@angular/forms/signals';

/** Whole numbers only. An empty value passes: `required` reports that case. */
export function integerError(value: number | null): ValidationError.WithoutFieldTree | undefined {
  if (value === null || Number.isInteger(value)) {
    return undefined;
  }
  return { kind: 'integer', message: 'Enter a whole number.' };
}
