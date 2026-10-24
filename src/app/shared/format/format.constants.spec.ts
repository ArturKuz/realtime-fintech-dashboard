import { MINUS_SIGN, UNAVAILABLE } from './format.constants';

describe('format constants', () => {
  it('marks unavailable values with an em dash', () => {
    expect(UNAVAILABLE).toBe('—');
  });

  it('uses the true minus sign, not the hyphen', () => {
    expect(MINUS_SIGN).toBe('−');
    expect(MINUS_SIGN).not.toBe('-');
  });
});
