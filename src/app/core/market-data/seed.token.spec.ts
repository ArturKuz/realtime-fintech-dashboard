import { TestBed } from '@angular/core/testing';
import { SEED_SOURCE } from './seed.token';

describe('SEED_SOURCE', () => {
  it('provides random unsigned 32-bit integer seeds by default', () => {
    const nextSeed = TestBed.inject(SEED_SOURCE);
    const seeds = Array.from({ length: 20 }, () => nextSeed());

    for (const seed of seeds) {
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThan(2 ** 32);
    }
    expect(new Set(seeds).size).toBeGreaterThan(1);
  });
});
