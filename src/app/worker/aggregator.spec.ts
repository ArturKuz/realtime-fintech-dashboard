import { UPDATE_STRIDE } from '@core/protocol/market-update-layout.constants';
import { instrumentAt } from '@testing/market-state.helpers';
import { packUpdates } from '@testing/market-update.builders';
import { WORKED_EXAMPLE_TRADES } from '@testing/market-update.fixtures';
import { aggregateBatch, createMarketState, toSnapshotRows } from './aggregator';
import { type MarketState } from './aggregator.model';

const [firstTrade, secondTrade] = WORKED_EXAMPLE_TRADES;

// Expected result of the worked example, written out so the assertions are visible here.
const workedExampleRow = {
  instrument: 0,
  lastPriceCents: 10200,
  spreadCents: 4,
  volume: 40n,
  vwapCents: 10150,
  imbalance: 0.2,
};

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
    const state = aggregateBatch(createMarketState(1), packUpdates(firstTrade, secondTrade));

    expect(toSnapshotRows(state)).toEqual([workedExampleRow]);
  });

  it('gives the same result when the two trades arrive in separate batches', () => {
    const afterFirst = aggregateBatch(createMarketState(1), packUpdates(firstTrade));
    const afterSecond = aggregateBatch(afterFirst, packUpdates(secondTrade));

    expect(toSnapshotRows(afterSecond)).toEqual([workedExampleRow]);
  });

  it('shows an unavailable imbalance when both book quantities are zero', () => {
    const state = aggregateBatch(
      createMarketState(1),
      packUpdates({ ...secondTrade, bidQty: 0, askQty: 0 }),
    );

    expect(toSnapshotRows(state)[0]?.imbalance).toBeNull();
  });

  it('keeps imbalance within [-1, +1] when one side of the book is empty', () => {
    const onlyBuyers = aggregateBatch(
      createMarketState(1),
      packUpdates({ ...secondTrade, askQty: 0 }),
    );
    const onlySellers = aggregateBatch(
      createMarketState(1),
      packUpdates({ ...secondTrade, bidQty: 0 }),
    );

    expect(toSnapshotRows(onlyBuyers)[0]?.imbalance).toBe(1);
    expect(toSnapshotRows(onlySellers)[0]?.imbalance).toBe(-1);
  });

  it('keeps instruments isolated: an update for one leaves the others untouched', () => {
    const before = aggregateBatch(createMarketState(2), packUpdates(firstTrade));
    const after = aggregateBatch(before, packUpdates({ ...secondTrade, instrument: 1 }));

    expect(instrumentAt(after, 0)).toBe(instrumentAt(before, 0));
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
      packUpdates(firstTrade, { ...firstTrade, instrument: 1 }, secondTrade),
    );

    expect(toSnapshotRows(state)[0]).toEqual(workedExampleRow);
  });

  it('counts every trade in volume and VWAP, however many arrive in one batch', () => {
    const trades = Array.from({ length: 1000 }, (_, i) => ({
      ...firstTrade,
      priceCents: i % 2 === 0 ? 10000 : 10200,
      tradeQty: 1,
    }));

    const row = toSnapshotRows(aggregateBatch(createMarketState(1), packUpdates(...trades)))[0];

    expect(row?.volume).toBe(1000n);
    expect(row?.vwapCents).toBe(10100);
  });

  it('sums a full batch at the largest price and quantity exactly', () => {
    const trades = Array.from({ length: 1000 }, () => ({
      ...firstTrade,
      priceCents: 100_000,
      tradeQty: 100,
    }));

    const state = aggregateBatch(createMarketState(1), packUpdates(...trades));

    expect(instrumentAt(state, 0).notional).toBe(10_000_000_000n);
    expect(instrumentAt(state, 0).volume).toBe(100_000n);
  });

  it('keeps running totals exact beyond Number.MAX_SAFE_INTEGER', () => {
    const big = 2n ** 53n;
    const start: MarketState = [
      { ...instrumentAt(createMarketState(1), 0), volume: big, notional: big },
    ];

    const state = aggregateBatch(start, packUpdates({ ...firstTrade, priceCents: 1, tradeQty: 1 }));

    // As plain numbers, 2^53 + 1 rounds back to 2^53.
    expect(instrumentAt(state, 0).volume).toBe(big + 1n);
    expect(instrumentAt(state, 0).notional).toBe(big + 1n);
  });

  it('does not change the previous state', () => {
    const before = createMarketState(1);
    const snapshot = structuredClone(before);

    aggregateBatch(before, packUpdates(firstTrade, secondTrade));

    expect(before).toEqual(snapshot);
  });

  it('returns the same values for an empty batch', () => {
    const before = aggregateBatch(createMarketState(1), packUpdates(firstTrade));

    expect(aggregateBatch(before, new Int32Array(0))).toEqual(before);
  });

  it('rejects a buffer that does not hold whole updates', () => {
    expect(() => aggregateBatch(createMarketState(1), new Int32Array(UPDATE_STRIDE + 1))).toThrow(
      RangeError,
    );
  });

  it('rejects an instrument index outside the current run', () => {
    expect(() =>
      aggregateBatch(createMarketState(1), packUpdates({ ...firstTrade, instrument: 1 })),
    ).toThrow(RangeError);
    expect(() =>
      aggregateBatch(createMarketState(1), packUpdates({ ...firstTrade, instrument: -1 })),
    ).toThrow(RangeError);
  });
});
