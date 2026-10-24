import { INSTRUMENT_SYMBOLS, symbolOf } from './instruments';
import { SETTINGS_LIMITS } from './settings';

describe('instrument symbols', () => {
  it('has one symbol for every instrument the settings allow', () => {
    expect(INSTRUMENT_SYMBOLS).toHaveLength(SETTINGS_LIMITS.instrumentCount.max);
  });

  it('starts with the symbols used in the task', () => {
    expect(INSTRUMENT_SYMBOLS.slice(0, 2)).toEqual(['ALFA', 'BETA']);
  });

  it('uses unique four-letter uppercase symbols', () => {
    expect(new Set(INSTRUMENT_SYMBOLS).size).toBe(INSTRUMENT_SYMBOLS.length);
    for (const symbol of INSTRUMENT_SYMBOLS) {
      expect(symbol).toMatch(/^[A-Z]{4}$/);
    }
  });

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
