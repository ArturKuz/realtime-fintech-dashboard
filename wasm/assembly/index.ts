// Market update generator, compiled to WebAssembly.
//
// Keeps one mid price per instrument and moves it with a small random walk. Each update picks a
// random instrument, steps its price, derives a bid/ask around it, and records one trade at either
// the bid or the ask. Updates are written as 7 consecutive i32 values into a buffer that JavaScript
// reads directly from Wasm memory:
//   [instrumentIndex, priceCents, tradeQty, bidCents, askCents, bidQty, askQty]
//
// All randomness comes from the xorshift32 generator below; the module imports nothing.

// Limits shared with the app (a test checks they match the TypeScript settings and layout).
export const MAX_INSTRUMENTS: i32 = 50;
export const MAX_BATCH: i32 = 1000;
export const UPDATE_STRIDE: i32 = 7;

// Price bounds keep prices positive and price × qty ≤ 100,000 × 100 = 10^7 per trade.
const PRICE_FLOOR_CENTS: i32 = 100; // $1
const PRICE_CEILING_CENTS: i32 = 100_000; // $1,000
const START_PRICE_MIN_CENTS: i32 = 2_000; // $20
const START_PRICE_MAX_CENTS: i32 = 50_000; // $500
const MAX_TRADE_QTY: i32 = 100;
const MAX_BOOK_QTY: i32 = 1000;

// xorshift32 must never hold 0 (it would stay 0 forever).
const FALLBACK_SEED: u32 = 0x9e3779b9;

let rngState: u32 = FALLBACK_SEED;
let instrumentCount: i32 = 1;

// Allocated once when the module starts; never freed (the stub runtime has no GC, none is needed).
const midPriceCents = new StaticArray<i32>(MAX_INSTRUMENTS);
const output = new StaticArray<i32>(MAX_BATCH * UPDATE_STRIDE);

/** Resets all state: instrument count, random sequence and starting prices. */
export function init(count: i32, seed: u32): void {
  instrumentCount = clamp(count, 1, MAX_INSTRUMENTS);
  rngState = seed != 0 ? seed : FALLBACK_SEED;
  for (let i = 0; i < instrumentCount; i++) {
    midPriceCents[i] = randomInRange(START_PRICE_MIN_CENTS, START_PRICE_MAX_CENTS);
  }
}

/** Writes `count` updates into the output buffer and returns its address. */
export function generate(count: i32): usize {
  const updates = clamp(count, 0, MAX_BATCH);
  for (let i = 0; i < updates; i++) {
    const instrument = <i32>randomBelow(<u32>instrumentCount);

    const mid = stepPrice(midPriceCents[instrument]);
    midPriceCents[instrument] = mid;

    // Spread of 1 cent up to ~0.05 % of the price, placed around the mid price.
    const spread = 1 + <i32>randomBelow(<u32>max<i32>(1, mid / 2000));
    let bid = mid - spread / 2;
    if (bid < PRICE_FLOOR_CENTS) bid = PRICE_FLOOR_CENTS;
    if (bid + spread > PRICE_CEILING_CENTS) bid = PRICE_CEILING_CENTS - spread;
    const ask = bid + spread;

    // A buyer lifts the ask or a seller hits the bid.
    const price = (nextRandom() & 1) == 1 ? ask : bid;

    const offset = i * UPDATE_STRIDE;
    output[offset] = instrument;
    output[offset + 1] = price;
    output[offset + 2] = randomInRange(1, MAX_TRADE_QTY);
    output[offset + 3] = bid;
    output[offset + 4] = ask;
    output[offset + 5] = randomInRange(0, MAX_BOOK_QTY);
    output[offset + 6] = randomInRange(0, MAX_BOOK_QTY);
  }
  return changetype<usize>(output);
}

/** Random walk: move by up to ±0.2 % of the price (at least 1 cent), within the bounds. */
function stepPrice(mid: i32): i32 {
  const maxStep = max<i32>(1, mid / 500);
  return clamp(mid + randomInRange(-maxStep, maxStep), PRICE_FLOOR_CENTS, PRICE_CEILING_CENTS);
}

/** xorshift32 (Marsaglia, 2003): three shifts and XORs give the next pseudo-random number. */
function nextRandom(): u32 {
  let x = rngState;
  x ^= x << 13;
  x ^= x >> 17;
  x ^= x << 5;
  rngState = x;
  return x;
}

/**
 * Uniform integer in [0, bound). Multiplies instead of using `%`: the high 32 bits of
 * random × bound are evenly spread, while `random % bound` slightly favours small values.
 */
function randomBelow(bound: u32): u32 {
  return <u32>((<u64>nextRandom() * <u64>bound) >> 32);
}

/** Uniform integer in [min, max], both inclusive. */
function randomInRange(min: i32, max: i32): i32 {
  return min + <i32>randomBelow(<u32>(max - min + 1));
}

function clamp(value: i32, low: i32, high: i32): i32 {
  return min<i32>(high, max<i32>(low, value));
}
