import { type InstrumentState } from './aggregator.model';

/** State of an instrument before its first update: nothing known yet, zero totals. */
export const EMPTY_INSTRUMENT_STATE: InstrumentState = {
  lastPriceCents: null,
  bidCents: null,
  askCents: null,
  bidQty: null,
  askQty: null,
  volume: 0n,
  notional: 0n,
};
