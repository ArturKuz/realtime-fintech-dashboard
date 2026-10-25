import { integerError } from './validators.utils';

describe('integerError', () => {
  it.each([0, 1, 50, -3, 1e2])('accepts the whole number %d', (value) => {
    expect(integerError(value)).toBeUndefined();
  });

  it('leaves an empty value to the required rule', () => {
    expect(integerError(null)).toBeUndefined();
  });

  it.each([1.5, 0.1, Number.NaN, Number.POSITIVE_INFINITY])('rejects %d', (value) => {
    expect(integerError(value)).toEqual({ kind: 'integer', message: 'Enter a whole number.' });
  });
});
