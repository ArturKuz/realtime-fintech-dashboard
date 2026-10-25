import { emptyRows } from './run-state.utils';

describe('emptyRows', () => {
  it('creates one row per instrument with every metric unavailable and zero volume', () => {
    expect(emptyRows(2)).toEqual([
      {
        instrument: 0,
        lastPriceCents: null,
        spreadCents: null,
        volume: 0n,
        vwapCents: null,
        imbalance: null,
      },
      {
        instrument: 1,
        lastPriceCents: null,
        spreadCents: null,
        volume: 0n,
        vwapCents: null,
        imbalance: null,
      },
    ]);
  });

  it('creates no rows for zero instruments', () => {
    expect(emptyRows(0)).toEqual([]);
  });
});
