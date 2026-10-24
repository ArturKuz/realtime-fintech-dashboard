import { UPDATE_FIELD, UPDATE_STRIDE } from '../core/protocol/market-update-layout';
import {
  aggregateBatch,
  createMarketState,
  type InstrumentState,
  type MarketState,
  toSnapshotRows,
} from './aggregator';

interface Update {
  instrument: number;
  priceCents: number;
  tradeQty: number;
  bidCents: number;
  askCents: number;
  bidQty: number;
  askQty: number;
}

/** Packs updates into the same flat Int32Array layout the Wasm generator writes. */
function batch(...updates: Update[]): Int32Array {
  const buffer = new Int32Array(updates.length * UPDATE_STRIDE);
  updates.forEach((u, i) => {
    const offset = i * UPDATE_STRIDE;
    for (const [field, index] of Object.entries(UPDATE_FIELD)) {
      buffer[offset + index] = u[field as keyof Update];
    }
  });
  return buffer;
}

// The task's worked example: 10 units at $100, then 30 units at $102 with bid $101.96 / ask $102.
const firstTrade: Update = {
  instrument: 0,
  priceCents: 10000,
  tradeQty: 10,
  bidCents: 9996,
  askCents: 10000,
  bidQty: 500,
  askQty: 300,
};
const secondTrade: Update = {
  instrument: 0,
  priceCents: 10200,
  tradeQty: 30,
  bidCents: 10196,
  askCents: 10200,
  bidQty: 600,
  askQty: 400,
};
const workedExampleRow = {
  instrument: 0,
  lastPriceCents: 10200,
  spreadCents: 4,
  volume: 40n,
  vwapCents: 10150,
  imbalance: 0.2,
};

function instrument(state: MarketState, index: number): InstrumentState {
  const entry = state[index];
  if (entry === undefined) {
    throw new Error(`no instrument ${index}`);
  }
  return entry;
}

describe('createMarketState', () => {
  it('starts every instrument with no data and zero totals', () => {
    const state = createMarketState(3);

    expect(state).toHaveLength(3);
    for (const entry of state) {
      expect(entry).toEqual({
        lastPriceCents: null,
        bidCents: null,
        askCents: null,
        bidQty: null,
        askQty: null,
        volume: 0n,
        notional: 0n,
      });
    }
  });
});

describe('toSnapshotRows before any data', () => {
  it('shows unavailable values and zero volume for every instrument', () => {
    expect(toSnapshotRows(createMarketState(2))).toEqual([
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
});

describe('aggregateBatch', () => {
  it('computes the worked example from one batch', () => {
    const state = aggregateBatch(createMarketState(1), batch(firstTrade, secondTrade));

    expect(toSnapshotRows(state)).toEqual([workedExampleRow]);
  });

  it('gives the same result when the two trades arrive in separate batches', () => {
    const afterFirst = aggregateBatch(createMarketState(1), batch(firstTrade));
    const afterSecond = aggregateBatch(afterFirst, batch(secondTrade));

    expect(toSnapshotRows(afterSecond)).toEqual([workedExampleRow]);
  });

  it('shows an unavailable imbalance when both book quantities are zero', () => {
    const state = aggregateBatch(
      createMarketState(1),
      batch({ ...secondTrade, bidQty: 0, askQty: 0 }),
    );

    expect(toSnapshotRows(state)[0]?.imbalance).toBeNull();
  });

  it('keeps imbalance within [-1, +1] when one side of the book is empty', () => {
    const onlyBuyers = aggregateBatch(createMarketState(1), batch({ ...secondTrade, askQty: 0 }));
    const onlySellers = aggregateBatch(createMarketState(1), batch({ ...secondTrade, bidQty: 0 }));

    expect(toSnapshotRows(onlyBuyers)[0]?.imbalance).toBe(1);
    expect(toSnapshotRows(onlySellers)[0]?.imbalance).toBe(-1);
  });

  it('keeps instruments isolated: an update for one leaves the others untouched', () => {
    const before = aggregateBatch(createMarketState(2), batch(firstTrade));
    const after = aggregateBatch(before, batch({ ...secondTrade, instrument: 1 }));

    expect(instrument(after, 0)).toBe(instrument(before, 0));
    expect(toSnapshotRows(after)[0]).toEqual({
      instrument: 0,
      lastPriceCents: 10000,
      spreadCents: 4,
      volume: 10n,
      vwapCents: 10000,
      imbalance: 0.25,
    });
    expect(toSnapshotRows(after)[1]).toEqual({
      ...workedExampleRow,
      instrument: 1,
      volume: 30n,
      vwapCents: 10200,
    });
  });

  it('takes the last price and book from the latest update when an instrument repeats in a batch', () => {
    const state = aggregateBatch(
      createMarketState(2),
      batch(firstTrade, { ...firstTrade, instrument: 1 }, secondTrade),
    );

    expect(toSnapshotRows(state)[0]).toEqual(workedExampleRow);
  });

  it('counts every trade in volume and VWAP, however many arrive in one batch', () => {
    const trades = Array.from({ length: 1000 }, (_, i) => ({
      ...firstTrade,
      priceCents: i % 2 === 0 ? 10000 : 10200,
      tradeQty: 1,
    }));

    const row = toSnapshotRows(aggregateBatch(createMarketState(1), batch(...trades)))[0];

    expect(row?.volume).toBe(1000n);
    expect(row?.vwapCents).toBe(10100);
  });

  it('sums a full batch at the largest price and quantity exactly', () => {
    const trades = Array.from({ length: 1000 }, () => ({
      ...firstTrade,
      priceCents: 100_000,
      tradeQty: 100,
    }));

    const state = aggregateBatch(createMarketState(1), batch(...trades));

    expect(instrument(state, 0).notional).toBe(10_000_000_000n);
    expect(instrument(state, 0).volume).toBe(100_000n);
  });

  it('keeps running totals exact beyond Number.MAX_SAFE_INTEGER', () => {
    const big = 2n ** 53n;
    const start: MarketState = [
      { ...instrument(createMarketState(1), 0), volume: big, notional: big },
    ];

    const state = aggregateBatch(start, batch({ ...firstTrade, priceCents: 1, tradeQty: 1 }));

    // As plain numbers, 2^53 + 1 rounds back to 2^53.
    expect(instrument(state, 0).volume).toBe(big + 1n);
    expect(instrument(state, 0).notional).toBe(big + 1n);
  });

  it('does not change the previous state', () => {
    const before = createMarketState(1);
    const snapshot = structuredClone(before);

    aggregateBatch(before, batch(firstTrade, secondTrade));

    expect(before).toEqual(snapshot);
  });

  it('returns the same values for an empty batch', () => {
    const before = aggregateBatch(createMarketState(1), batch(firstTrade));

    expect(aggregateBatch(before, new Int32Array(0))).toEqual(before);
  });

  it('rejects a buffer that does not hold whole updates', () => {
    expect(() => aggregateBatch(createMarketState(1), new Int32Array(UPDATE_STRIDE + 1))).toThrow(
      RangeError,
    );
  });

  it('rejects an instrument index outside the current run', () => {
    expect(() =>
      aggregateBatch(createMarketState(1), batch({ ...firstTrade, instrument: 1 })),
    ).toThrow(RangeError);
    expect(() =>
      aggregateBatch(createMarketState(1), batch({ ...firstTrade, instrument: -1 })),
    ).toThrow(RangeError);
  });
});
