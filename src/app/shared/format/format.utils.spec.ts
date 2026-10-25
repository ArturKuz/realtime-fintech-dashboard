import { UNAVAILABLE } from './format.constants';
import { formatCents, formatImbalance, formatRate, formatVolume } from './format.utils';

describe('formatCents', () => {
  it('formats the worked example as US dollars', () => {
    expect(formatCents(10200)).toBe('$102.00'); // last price
    expect(formatCents(10150)).toBe('$101.50'); // VWAP
    expect(formatCents(4)).toBe('$0.04'); // spread
  });

  it('groups thousands', () => {
    expect(formatCents(123456789)).toBe('$1,234,567.89');
  });

  it('rounds an unrounded value to the nearest cent only for display', () => {
    expect(formatCents(10150.4)).toBe('$101.50');
    expect(formatCents(10150.6)).toBe('$101.51');
  });

  it('rounds a half cent up', () => {
    expect(formatCents(10150.5)).toBe('$101.51');
  });

  it('shows the unavailable mark for null', () => {
    expect(formatCents(null)).toBe(UNAVAILABLE);
  });
});

describe('formatVolume', () => {
  it('formats the worked example volume', () => {
    expect(formatVolume(40n)).toBe('40');
  });

  it('shows zero volume before any trade', () => {
    expect(formatVolume(0n)).toBe('0');
  });

  it('groups thousands', () => {
    expect(formatVolume(1234567n)).toBe('1,234,567');
  });

  it('stays exact beyond Number.MAX_SAFE_INTEGER', () => {
    expect(formatVolume(9_007_199_254_740_993n)).toBe('9,007,199,254,740,993');
  });
});

describe('formatImbalance', () => {
  it('formats the worked example as a signed value with two decimals', () => {
    expect(formatImbalance(0.2)).toBe('+0.20');
  });

  it('uses a true minus sign for negative values', () => {
    expect(formatImbalance(-0.35)).toBe('−0.35');
  });

  it('shows the bounds of the range', () => {
    expect(formatImbalance(1)).toBe('+1.00');
    expect(formatImbalance(-1)).toBe('−1.00');
  });

  it('shows zero, and values that round to zero, without a sign', () => {
    expect(formatImbalance(0)).toBe('0.00');
    expect(formatImbalance(-0)).toBe('0.00');
    expect(formatImbalance(-0.004)).toBe('0.00');
    expect(formatImbalance(0.004)).toBe('0.00');
  });

  it('shows the unavailable mark for null', () => {
    expect(formatImbalance(null)).toBe(UNAVAILABLE);
  });
});

describe('formatRate', () => {
  it('shows whole updates per second with thousands separators', () => {
    expect(formatRate(200)).toBe('200 updates/s');
    expect(formatRate(198.4)).toBe('198 updates/s');
    expect(formatRate(20000)).toBe('20,000 updates/s');
  });

  it('shows the unavailable mark for null (not measured yet)', () => {
    expect(formatRate(null)).toBe(UNAVAILABLE);
  });
});
