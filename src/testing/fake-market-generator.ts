import { type MarketUpdate } from '@core/protocol/market-update.model';
import { type MarketGenerator } from '@worker/generator.model';
import { packUpdates } from './market-update.builders';

/** One trade of 1 unit at $100 for instrument 0: after k batches of n, volume is k × n. */
export const FAKE_UPDATE: MarketUpdate = {
  instrument: 0,
  priceCents: 10000,
  tradeQty: 1,
  bidCents: 9999,
  askCents: 10000,
  bidQty: 10,
  askQty: 10,
};

/** Stands in for the Wasm generator: every batch repeats FAKE_UPDATE `updateCount` times. */
export class FakeMarketGenerator implements MarketGenerator {
  readonly maxInstruments = 50;
  readonly maxBatch = 1000;
  readonly updateStride = 7;

  readonly init = vi.fn<(instrumentCount: number, seed: number) => void>();
  readonly generate = vi.fn<(updateCount: number) => Int32Array>((updateCount) =>
    packUpdates(...Array.from({ length: updateCount }, () => FAKE_UPDATE)),
  );
}
