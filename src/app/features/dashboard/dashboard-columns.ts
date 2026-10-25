import { symbolOf } from '@core/market-data/instruments.utils';
import { type SnapshotRow } from '@core/protocol/messages.model';
import { formatCents, formatImbalance, formatVolume } from '@shared/format/format.utils';
import { type DashboardColumn, type DisplayRow } from './dashboard.model';

/** The table, column by column. Adding a metric to the table = adding one entry here. */
export const DASHBOARD_COLUMNS: readonly DashboardColumn[] = [
  {
    id: 'instrument',
    header: 'Instrument',
    align: 'start',
    format: (row) => symbolOf(row.instrument),
  },
  {
    id: 'lastPrice',
    header: 'Last price',
    align: 'end',
    format: (row) => formatCents(row.lastPriceCents),
  },
  { id: 'spread', header: 'Spread', align: 'end', format: (row) => formatCents(row.spreadCents) },
  { id: 'volume', header: 'Volume', align: 'end', format: (row) => formatVolume(row.volume) },
  { id: 'vwap', header: 'VWAP', align: 'end', format: (row) => formatCents(row.vwapCents) },
  {
    id: 'imbalance',
    header: 'Imbalance',
    align: 'end',
    format: (row) => formatImbalance(row.imbalance),
  },
];

/** Formats a snapshot once: O(instruments × columns) per batch, nothing in the template. */
export function toDisplayRows(
  rows: readonly SnapshotRow[],
  columns: readonly DashboardColumn[] = DASHBOARD_COLUMNS,
): readonly DisplayRow[] {
  return rows.map((row) => ({
    instrument: row.instrument,
    cells: columns.map((column) => column.format(row)),
  }));
}
