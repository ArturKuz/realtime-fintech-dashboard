import { INSTRUMENT_SYMBOLS } from './instruments.constants';
import { symbolOf } from './instruments.utils';

describe('symbolOf', () => {
  it('maps an instrument index from the generator to its symbol', () => {
    expect(symbolOf(0)).toBe('ALFA');
    expect(symbolOf(1)).toBe('BETA');
    expect(symbolOf(49)).toBe(INSTRUMENT_SYMBOLS[49]);
  });

  it('fails loudly for an index outside the list', () => {
    expect(() => symbolOf(50)).toThrow(RangeError);
    expect(() => symbolOf(-1)).toThrow(RangeError);
  });
});
