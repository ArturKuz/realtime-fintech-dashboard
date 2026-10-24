import { type SnapshotRow } from '@core/protocol/messages.model';

/** The snapshot row the task's worked example produces for instrument 0. */
export const WORKED_EXAMPLE_SNAPSHOT_ROW: SnapshotRow = {
  instrument: 0,
  lastPriceCents: 10200,
  spreadCents: 4,
  volume: 40n,
  vwapCents: 10150,
  imbalance: 0.2,
};
