import { type MarketUpdate } from '@core/protocol/market-update.model';

/**
 * The task's worked example for one instrument: 10 units at $100, then 30 units at $102 with
 * bid $101.96 / ask $102 and book quantities 600 / 400.
 * Expected: last $102, volume 40, VWAP $101.50, spread $0.04, imbalance 0.20.
 */
export const WORKED_EXAMPLE_TRADES: readonly [MarketUpdate, MarketUpdate] = [
  {
    instrument: 0,
    priceCents: 10000,
    tradeQty: 10,
    bidCents: 9996,
    askCents: 10000,
    bidQty: 500,
    askQty: 300,
  },
  {
    instrument: 0,
    priceCents: 10200,
    tradeQty: 30,
    bidCents: 10196,
    askCents: 10200,
    bidQty: 600,
    askQty: 400,
  },
];
