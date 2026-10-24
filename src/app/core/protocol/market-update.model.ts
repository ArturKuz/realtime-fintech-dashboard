/**
 * One generated market update: a simulated trade plus the current top of the order book.
 * On the wire it is 7 consecutive i32 values (see market-update-layout.constants.ts); this is the
 * decoded, named form.
 */
export interface MarketUpdate {
  readonly instrument: number;
  readonly priceCents: number;
  readonly tradeQty: number;
  readonly bidCents: number;
  readonly askCents: number;
  readonly bidQty: number;
  readonly askQty: number;
}
