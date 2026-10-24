import { INSTRUMENT_SYMBOLS } from './instruments.constants';
import { SETTINGS_LIMITS } from './settings.constants';

describe('INSTRUMENT_SYMBOLS', () => {
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
});
