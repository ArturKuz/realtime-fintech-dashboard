import { UPDATE_FIELD, UPDATE_STRIDE } from '@core/protocol/market-update-layout.constants';
import { type SnapshotRow } from '@core/protocol/messages.model';
import { EMPTY_INSTRUMENT_STATE } from './aggregator.constants';
import { type InstrumentState, type MarketState } from './aggregator.model';

export function createMarketState(instrumentCount: number): MarketState {
  return Array.from({ length: instrumentCount }, () => EMPTY_INSTRUMENT_STATE);
}

/**
 * Folds one batch of raw updates (the generator's flat i32 layout) into a new state.
 *
 * Within a batch, per-instrument sums are plain numbers: at most 1,000 updates × 10⁷ = 10¹⁰, far
 * below 2⁵³, so they are exact. Each touched instrument then adds them to its bigint totals once,
 * instead of creating a bigint per update. Untouched instruments keep their previous object.
 */
export function aggregateBatch(state: MarketState, updates: Int32Array): MarketState {
  if (updates.length % UPDATE_STRIDE !== 0) {
    throw new RangeError(
      `Update buffer length ${updates.length} is not a multiple of ${UPDATE_STRIDE}`,
    );
  }

  // The length is checked above and instrument indices below, so every read is in range;
  // `?? 0` only satisfies noUncheckedIndexedAccess.
  const read = (offset: number, field: number): number => updates[offset + field] ?? 0;

  const instrumentCount = state.length;
  const batchQty = new Float64Array(instrumentCount);
  const batchNotional = new Float64Array(instrumentCount);
  const latestOffset = new Int32Array(instrumentCount).fill(-1);

  for (let offset = 0; offset < updates.length; offset += UPDATE_STRIDE) {
    const index = read(offset, UPDATE_FIELD.instrument);
    if (index < 0 || index >= instrumentCount) {
      throw new RangeError(`Instrument index ${index} is outside 0..${instrumentCount - 1}`);
    }
    const qty = read(offset, UPDATE_FIELD.tradeQty);

    batchQty[index] = (batchQty[index] ?? 0) + qty;
    batchNotional[index] =
      (batchNotional[index] ?? 0) + read(offset, UPDATE_FIELD.priceCents) * qty;
    latestOffset[index] = offset;
  }

  return state.map((previous, index) => {
    const offset = latestOffset[index] ?? -1;
    if (offset === -1) {
      return previous;
    }
    return {
      lastPriceCents: read(offset, UPDATE_FIELD.priceCents),
      bidCents: read(offset, UPDATE_FIELD.bidCents),
      askCents: read(offset, UPDATE_FIELD.askCents),
      bidQty: read(offset, UPDATE_FIELD.bidQty),
      askQty: read(offset, UPDATE_FIELD.askQty),
      volume: previous.volume + BigInt(batchQty[index] ?? 0),
      notional: previous.notional + BigInt(batchNotional[index] ?? 0),
    };
  });
}

/** Derives the displayed metrics. Any zero denominator or missing input gives `null`. */
export function toSnapshotRows(state: MarketState): SnapshotRow[] {
  return state.map((entry, instrument) => ({
    instrument,
    lastPriceCents: entry.lastPriceCents,
    spreadCents: spread(entry),
    volume: entry.volume,
    vwapCents: vwap(entry),
    imbalance: imbalance(entry),
  }));
}

function spread({ bidCents, askCents }: InstrumentState): number | null {
  return bidCents === null || askCents === null ? null : askCents - bidCents;
}

function vwap({ volume, notional }: InstrumentState): number | null {
  // Number() only here, for the final division; the result is rounded to cents for display anyway.
  return volume === 0n ? null : Number(notional) / Number(volume);
}

function imbalance({ bidQty, askQty }: InstrumentState): number | null {
  if (bidQty === null || askQty === null) {
    return null;
  }
  const total = bidQty + askQty;
  return total === 0 ? null : (bidQty - askQty) / total;
}
