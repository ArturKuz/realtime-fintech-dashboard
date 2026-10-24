/**
 * Layout of one market update in the generator's output buffer: 7 consecutive i32 values.
 * The Wasm module writes this layout; the worker reads it through an Int32Array view.
 */
export const UPDATE_FIELD = {
  instrument: 0,
  priceCents: 1,
  tradeQty: 2,
  bidCents: 3,
  askCents: 4,
  bidQty: 5,
  askQty: 6,
} as const;

/** Number of i32 values per update. */
export const UPDATE_STRIDE = 7;
