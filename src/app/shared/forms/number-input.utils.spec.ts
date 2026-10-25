import { formatNumberInput, parseNumberInput } from './number-input.utils';

describe('parseNumberInput', () => {
  it.each([
    ['12', 12],
    [' 12 ', 12],
    ['-3', -3],
    ['1.5', 1.5],
    ['.5', 0.5],
    ['1e2', 100],
  ])('reads %j as %d', (text, value) => {
    expect(parseNumberInput(text)).toEqual({ value });
  });

  it.each(['', '   '])('reads empty text %j as no value (null)', (text) => {
    expect(parseNumberInput(text)).toEqual({ value: null });
  });

  it.each(['12a', '1,000', '0x10', 'Infinity', '--1', '1e', '.'])(
    'rejects %j with a plain message and keeps the previous value',
    (text) => {
      expect(parseNumberInput(text)).toEqual({
        error: { kind: 'parse', message: 'Enter a number, for example 100.' },
      });
    },
  );
});

describe('formatNumberInput', () => {
  it('shows a number as plain digits and no value as empty text', () => {
    expect(formatNumberInput(500)).toBe('500');
    expect(formatNumberInput(null)).toBe('');
  });
});
