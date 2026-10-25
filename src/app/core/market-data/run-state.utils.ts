import { type SnapshotRow } from '@core/protocol/messages.model';

/** What the table shows for a new run before its first snapshot: nothing known, nothing traded. */
export function emptyRows(instrumentCount: number): readonly SnapshotRow[] {
  return Array.from({ length: instrumentCount }, (_, instrument) => ({
    instrument,
    lastPriceCents: null,
    spreadCents: null,
    volume: 0n,
    vwapCents: null,
    imbalance: null,
  }));
}
