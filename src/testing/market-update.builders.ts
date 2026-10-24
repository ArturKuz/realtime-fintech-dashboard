import { UPDATE_FIELD, UPDATE_STRIDE } from '@core/protocol/market-update-layout.constants';
import { type MarketUpdate } from '@core/protocol/market-update.model';

/** Packs updates into the same flat Int32Array layout the Wasm generator writes. */
export function packUpdates(...updates: readonly MarketUpdate[]): Int32Array {
  const buffer = new Int32Array(updates.length * UPDATE_STRIDE);
  updates.forEach((update, i) => {
    const offset = i * UPDATE_STRIDE;
    for (const [field, index] of Object.entries(UPDATE_FIELD)) {
      buffer[offset + index] = update[field as keyof MarketUpdate];
    }
  });
  return buffer;
}
