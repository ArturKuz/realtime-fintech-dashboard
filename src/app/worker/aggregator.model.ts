/**
 * Everything kept per instrument for the current run. Cumulative metrics need only two running
 * sums, so no trade history is stored.
 */
export interface InstrumentState {
  readonly lastPriceCents: number | null;
  readonly bidCents: number | null;
  readonly askCents: number | null;
  readonly bidQty: number | null;
  readonly askQty: number | null;
  /** Σ trade quantity since the run started. */
  readonly volume: bigint;
  /** Σ (trade price in cents × trade quantity) since the run started. */
  readonly notional: bigint;
}

/** One entry per instrument, indexed by the generator's instrument index. */
export type MarketState = readonly InstrumentState[];
