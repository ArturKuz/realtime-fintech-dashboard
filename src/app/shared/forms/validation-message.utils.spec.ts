import { maxError, minError, patternError, requiredError } from '@angular/forms/signals';
import { validationMessage } from './validation-message.utils';

describe('validationMessage', () => {
  it('asks for a value when it is required', () => {
    expect(validationMessage(requiredError())).toBe('Enter a value.');
  });

  it('names the allowed bound for min and max', () => {
    expect(validationMessage(minError(1))).toBe('Enter 1 or more.');
    expect(validationMessage(maxError(2000))).toBe('Enter 2000 or less.');
  });

  it('uses the message an error brings with it (custom validators, parse errors)', () => {
    expect(validationMessage({ kind: 'integer', message: 'Enter a whole number.' })).toBe(
      'Enter a whole number.',
    );
    expect(validationMessage(minError(1, { message: 'Too few.' }))).toBe('Too few.');
  });

  it('falls back to a generic message for anything else', () => {
    expect(validationMessage(patternError(/x/))).toBe('Enter a valid value.');
    expect(validationMessage({ kind: 'unknown' })).toBe('Enter a valid value.');
  });
});
