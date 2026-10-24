// Display formatting. Values stay exact (integer cents, bigint totals) until they reach this file;
// rounding happens here and nowhere else.

/** Shown for any value that is unavailable (no data yet, or a zero denominator). */
export const UNAVAILABLE = '—';

const MINUS_SIGN = '−';

// Formatters are created once: constructing Intl.NumberFormat is far more expensive than using it.
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const integer = new Intl.NumberFormat('en-US');
const signedTwoDecimals = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
});

/** Price in cents (possibly unrounded, e.g. VWAP) as US dollars: 10150 → "$101.50". */
export function formatCents(cents: number | null): string {
  if (cents === null) {
    return UNAVAILABLE;
  }
  // Round to whole cents ourselves (half a cent rounds up), so the rule does not depend on how an
  // Intl engine treats dollar values like 101.505 that have no exact binary representation.
  return usd.format(Math.round(cents) / 100);
}

/** Cumulative traded quantity: 1234567n → "1,234,567". Exact for any bigint. */
export function formatVolume(volume: bigint): string {
  return integer.format(volume);
}

/** Order-book imbalance in [-1, +1] with two decimals and a sign: 0.2 → "+0.20", -0.35 → "−0.35". */
export function formatImbalance(value: number | null): string {
  if (value === null) {
    return UNAVAILABLE;
  }
  return signedTwoDecimals.format(value).replace('-', MINUS_SIGN);
}
