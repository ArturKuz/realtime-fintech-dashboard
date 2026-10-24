import { type InstrumentState, type MarketState } from '@worker/aggregator.model';

/** Reads one instrument's state, failing the test clearly if the index does not exist. */
export function instrumentAt(state: MarketState, index: number): InstrumentState {
  const entry = state[index];
  if (entry === undefined) {
    throw new Error(`Market state has no instrument ${index}`);
  }
  return entry;
}
